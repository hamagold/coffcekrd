import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get PLC config from app_settings
    const { data: plcData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "plc_config")
      .single();

    const rawConfig = (plcData?.value as any) || {};
    
    // Support multi-machine config
    const machines = rawConfig.machines || [{
      machineId: rawConfig.machineId || "machine-01",
      ip: rawConfig.ip || "192.168.1.100",
      port: rawConfig.port || "502",
    }];
    const autoSend = rawConfig.autoSend || false;

    if (!autoSend) {
      return new Response(
        JSON.stringify({ success: false, message: "Auto-send is disabled in PLC settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { orderNumber, items, total, payment } = await req.json();

    // Build PLC command payload with unique item identification
    // Each item has: plc_code (unique numeric ID), id (string ID), name (multilingual), qty, category
    const plcPayload = {
      command: "PREPARE_ORDER",
      order_number: orderNumber,
      items: items.map((item: any, index: number) => ({
        plc_code: item.plc_code || (index + 1),  // Unique numeric code for PLC machine
        item_id: item.id,                          // String ID like "r1", "r2"
        name_en: item.name?.en || item.id,         // English name for logging
        name_ku: item.name?.ku || "",              // Kurdish name
        name_ar: item.name?.ar || "",              // Arabic name
        qty: item.qty,
        category: item.cat,
      })),
      item_count: items.length,
      total_qty: items.reduce((sum: number, item: any) => sum + (item.qty || 1), 0),
      total,
      payment,
      timestamp: new Date().toISOString(),
    };

    // Send to all machines
    const results: any[] = [];
    for (const machine of machines) {
      const plcUrl = `http://${machine.ip}:${machine.port}`;
      let plcResponse = null;
      let plcError = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch(`${plcUrl}/api/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plcPayload),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        plcResponse = await resp.text();
      } catch (err: any) {
        plcError = err.message || "Failed to connect to PLC";
      }

      results.push({
        machineId: machine.machineId,
        ip: machine.ip,
        success: !plcError,
        error: plcError,
        response: plcResponse,
      });
    }

    const anySuccess = results.some((r: any) => r.success);

    // Log the attempt with full item details
    const logEntry = {
      orderNumber,
      itemCount: items.length,
      items: items.map((item: any) => ({
        plc_code: item.plc_code,
        id: item.id,
        name: item.name?.en || item.id,
        qty: item.qty,
      })),
      total,
      machines: results,
      success: anySuccess,
      timestamp: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("app_settings")
      .select("id, value")
      .eq("key", "plc_logs")
      .single();

    const logs = existing ? ((existing.value as any)?.logs || []) : [];
    logs.unshift(logEntry);
    if (logs.length > 50) logs.length = 50;

    if (existing) {
      await supabase
        .from("app_settings")
        .update({ value: { logs } as any, updated_at: new Date().toISOString() })
        .eq("key", "plc_logs");
    } else {
      await supabase
        .from("app_settings")
        .insert({ key: "plc_logs", value: { logs } as any });
    }

    return new Response(
      JSON.stringify({
        success: anySuccess,
        message: anySuccess ? "Order sent to PLC machines" : "Failed to send to all machines",
        payload: plcPayload,  // Return payload for debugging
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
