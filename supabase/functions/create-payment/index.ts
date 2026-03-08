import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { provider, amount, orderNumber, callbackUrl, lang } = await req.json();

    // Get payment keys from app_settings
    const { data: keysData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "payment_keys")
      .single();

    const keys = (keysData?.value as any) || {};
    const providerKeys = keys[provider] || {};

    // Create pending order record for payment tracking
    const paymentId = crypto.randomUUID();

    // Store payment session
    const { data: existingSession } = await supabase
      .from("app_settings")
      .select("id, value")
      .eq("key", "payment_sessions")
      .maybeSingle();

    const sessions = existingSession ? ((existingSession.value as any)?.sessions || {}) : {};
    sessions[paymentId] = {
      provider,
      amount,
      orderNumber,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Keep only last 100 sessions
    const sessionKeys = Object.keys(sessions);
    if (sessionKeys.length > 100) {
      const toRemove = sessionKeys.slice(0, sessionKeys.length - 100);
      toRemove.forEach(k => delete sessions[k]);
    }

    if (existingSession) {
      await supabase
        .from("app_settings")
        .update({ value: { sessions } as any, updated_at: new Date().toISOString() })
        .eq("key", "payment_sessions");
    } else {
      await supabase
        .from("app_settings")
        .insert({ key: "payment_sessions", value: { sessions } as any });
    }

    let paymentResult: any = null;

    // ======= FIB Payment =======
    if (provider === "fib") {
      const apiKey = providerKeys[0] || ""; // API KEY
      const merchantId = providerKeys[1] || ""; // MERCHANT ID

      if (!apiKey || !merchantId) {
        return new Response(
          JSON.stringify({ success: false, error: "FIB API credentials not configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      try {
        // FIB uses OAuth2 for auth
        const authUrl = "https://fib.prod.fib.iq/auth/realms/fib-online-shop/protocol/openid-connect/token";
        const authResp = await fetch(authUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=client_credentials&client_id=${encodeURIComponent(merchantId)}&client_secret=${encodeURIComponent(apiKey)}`,
        });
        const authData = await authResp.json();

        if (!authData.access_token) {
          throw new Error("FIB authentication failed");
        }

        // Create payment
        const webhookUrl = `${supabaseUrl}/functions/v1/payment-callback`;
        const createResp = await fetch("https://fib.prod.fib.iq/protected/v1/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monetaryValue: { amount, currency: "IQD" },
            statusCallbackUrl: `${webhookUrl}?paymentId=${paymentId}&provider=fib`,
            description: `Order #${orderNumber}`,
          }),
        });
        const createData = await createResp.json();

        if (createData.paymentId) {
          // Update session with provider payment ID
          sessions[paymentId].providerPaymentId = createData.paymentId;
          await supabase
            .from("app_settings")
            .update({ value: { sessions } as any, updated_at: new Date().toISOString() })
            .eq("key", "payment_sessions");

          paymentResult = {
            paymentId,
            qrCode: createData.qrCode,
            paymentLink: createData.personalAppLink || createData.businessAppLink,
            readableCode: createData.readableCode,
            providerPaymentId: createData.paymentId,
          };
        } else {
          throw new Error(createData.message || "Failed to create FIB payment");
        }
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: `FIB Error: ${err.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // ======= ZainCash Payment =======
    else if (provider === "zain") {
      const merchantToken = providerKeys[0] || ""; // MERCHANT TOKEN
      const msisdn = providerKeys[1] || ""; // MSISDN
      const secretKey = providerKeys[2] || ""; // SECRET KEY

      if (!merchantToken || !msisdn || !secretKey) {
        return new Response(
          JSON.stringify({ success: false, error: "ZainCash credentials not configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      try {
        const webhookUrl = `${supabaseUrl}/functions/v1/payment-callback?paymentId=${paymentId}&provider=zain`;

        // Create JWT token for ZainCash
        const header = base64encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        const payload = base64encode(JSON.stringify({
          amount,
          serviceType: "Order Payment",
          msisdn,
          orderId: orderNumber,
          redirectUrl: webhookUrl,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        // HMAC-SHA256 signing
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secretKey);
        const cryptoKey = await crypto.subtle.importKey(
          "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signatureData = await crypto.subtle.sign(
          "HMAC", cryptoKey, encoder.encode(`${header}.${payload}`)
        );
        const signature = base64encode(new Uint8Array(signatureData))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        const token = `${header}.${payload}.${signature}`;

        // Initialize transaction
        const initResp = await fetch("https://api.zaincash.iq/transaction/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            merchantId: merchantToken,
            lang: lang || "ar",
          }),
        });
        const initData = await initResp.json();

        if (initData.id) {
          sessions[paymentId].providerPaymentId = initData.id;
          await supabase
            .from("app_settings")
            .update({ value: { sessions } as any, updated_at: new Date().toISOString() })
            .eq("key", "payment_sessions");

          paymentResult = {
            paymentId,
            paymentLink: `https://api.zaincash.iq/transaction/pay?id=${initData.id}`,
            providerPaymentId: initData.id,
          };
        } else {
          throw new Error(initData.msg || "Failed to create ZainCash transaction");
        }
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: `ZainCash Error: ${err.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // ======= FastPay Payment =======
    else if (provider === "fastpay") {
      const apiKey = providerKeys[0] || ""; // API KEY
      const walletId = providerKeys[1] || ""; // WALLET ID

      if (!apiKey || !walletId) {
        return new Response(
          JSON.stringify({ success: false, error: "FastPay credentials not configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      try {
        const webhookUrl = `${supabaseUrl}/functions/v1/payment-callback?paymentId=${paymentId}&provider=fastpay`;

        const createResp = await fetch("https://api.fastpay.iq/api/v1/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: "IQD",
            wallet_id: walletId,
            order_id: orderNumber,
            description: `Order #${orderNumber}`,
            callback_url: webhookUrl,
          }),
        });
        const createData = await createResp.json();

        if (createData.payment_id || createData.id) {
          const fpPaymentId = createData.payment_id || createData.id;
          sessions[paymentId].providerPaymentId = fpPaymentId;
          await supabase
            .from("app_settings")
            .update({ value: { sessions } as any, updated_at: new Date().toISOString() })
            .eq("key", "payment_sessions");

          paymentResult = {
            paymentId,
            paymentLink: createData.payment_url || createData.redirect_url,
            qrCode: createData.qr_code,
            providerPaymentId: fpPaymentId,
          };
        } else {
          throw new Error(createData.message || "Failed to create FastPay payment");
        }
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: `FastPay Error: ${err.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Unknown payment provider" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, ...paymentResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
