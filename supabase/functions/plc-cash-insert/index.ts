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

    const { machine_id, amount, action } = await req.json();

    if (!machine_id) {
      return new Response(
        JSON.stringify({ success: false, message: "machine_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Action: "insert" (cash inserted), "reset" (clear balance), "status" (get current)
    if (action === "reset") {
      const { error } = await supabase
        .from("plc_sessions")
        .update({ balance: 0, updated_at: new Date().toISOString() })
        .eq("machine_id", machine_id)
        .eq("status", "active");

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Balance reset", balance: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const { data } = await supabase
        .from("plc_sessions")
        .select("*")
        .eq("machine_id", machine_id)
        .eq("status", "active")
        .single();

      return new Response(
        JSON.stringify({ success: true, session: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default action: insert cash
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Valid amount is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const validDenominations = [1000, 5000, 10000, 25000, 50000];
    if (!validDenominations.includes(amount)) {
      return new Response(
        JSON.stringify({ success: false, message: `Invalid denomination. Valid: ${validDenominations.join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Find or create active session for this machine
    const { data: existing } = await supabase
      .from("plc_sessions")
      .select("*")
      .eq("machine_id", machine_id)
      .eq("status", "active")
      .single();

    let newBalance: number;

    if (existing) {
      newBalance = existing.balance + amount;
      const { error } = await supabase
        .from("plc_sessions")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      newBalance = amount;
      const { error } = await supabase
        .from("plc_sessions")
        .insert({ machine_id, balance: newBalance });
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cash accepted: ${amount} IQD`,
        balance: newBalance,
        amount_inserted: amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
