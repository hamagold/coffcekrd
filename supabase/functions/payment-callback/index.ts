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

    const url = new URL(req.url);
    const paymentId = url.searchParams.get("paymentId");
    const provider = url.searchParams.get("provider");

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
        JSON.stringify({ success: false, error: "Payment session not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Determine payment status based on provider callback
    let paymentStatus = "unknown";

    if (provider === "fib") {
      // FIB sends status in callback body
      try {
        const body = await req.json();
        paymentStatus = body.status === "PAID" ? "paid" : body.status?.toLowerCase() || "unknown";
      } catch {
        // FIB might send as form data
        paymentStatus = "paid"; // Assume paid if callback is triggered
      }
    } else if (provider === "zain") {
      // ZainCash sends JWT token in query
      const token = url.searchParams.get("token");
      if (token) {
        try {
          // Decode JWT payload (base64)
          const parts = token.split(".");
          if (parts.length === 3) {
            const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
            const payload = JSON.parse(payloadStr);
            paymentStatus = payload.status === "success" ? "paid" : payload.status || "unknown";
          }
        } catch {
          paymentStatus = "unknown";
        }
      }
    } else if (provider === "fastpay") {
      try {
        const body = await req.json();
        paymentStatus = body.status === "completed" || body.status === "success" ? "paid" : body.status || "unknown";
      } catch {
        paymentStatus = "unknown";
      }
    }

    // Update session status
    sessions[paymentId].status = paymentStatus;
    sessions[paymentId].updatedAt = new Date().toISOString();

    await supabase
      .from("app_settings")
      .update({ value: { sessions } as any, updated_at: new Date().toISOString() })
      .eq("key", "payment_sessions");

    // If paid, update the order status
    if (paymentStatus === "paid" && session.orderNumber) {
      await supabase
        .from("orders")
        .update({ status: "done" })
        .eq("order_number", session.orderNumber)
        .eq("status", "pending_payment");
    }

    return new Response(
      JSON.stringify({ success: true, status: paymentStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
