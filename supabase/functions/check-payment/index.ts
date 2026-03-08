import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { paymentId } = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing paymentId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get payment session
    const { data: sessionData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "payment_sessions")
      .single();

    const sessions = (sessionData?.value as any)?.sessions || {};
    const session = sessions[paymentId];

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If still pending, try checking with provider API
    if (session.status === "pending" && session.providerPaymentId) {
      const { data: keysData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "payment_keys")
        .single();

      const keys = (keysData?.value as any) || {};
      const providerKeys = keys[session.provider] || {};

      if (session.provider === "fib") {
        try {
          const apiKey = providerKeys[0] || "";
          const merchantId = providerKeys[1] || "";

          // Get FIB access token
          const authResp = await fetch(
            "https://fib.prod.fib.iq/auth/realms/fib-online-shop/protocol/openid-connect/token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `grant_type=client_credentials&client_id=${encodeURIComponent(merchantId)}&client_secret=${encodeURIComponent(apiKey)}`,
            }
          );
          const authData = await authResp.json();

          if (authData.access_token) {
            const statusResp = await fetch(
              `https://fib.prod.fib.iq/protected/v1/payments/${session.providerPaymentId}/status`,
              {
                headers: { "Authorization": `Bearer ${authData.access_token}` },
              }
            );
            const statusData = await statusResp.json();

            if (statusData.status === "PAID") {
              session.status = "paid";
              sessions[paymentId] = session;
              await supabase
                .from("app_settings")
                .update({ value: { sessions } as any, updated_at: new Date().toISOString() })
                .eq("key", "payment_sessions");

              // Confirm the order
              await supabase
                .from("orders")
                .update({ status: "done" })
                .eq("order_number", session.orderNumber)
                .eq("status", "pending_payment");
            }
          }
        } catch (err) {
          console.error("FIB status check error:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: session.status,
        provider: session.provider,
        amount: session.amount,
        orderNumber: session.orderNumber,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
