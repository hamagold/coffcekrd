import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Modbus TCP Frame Builder for Siemens S7-200 Smart
 * 
 * Register Mapping (HoldStart = VB1000, MaxHold = 200):
 *   Modbus Register 40001 (offset 0) = VW1000
 *   Modbus Register 40102 (offset 101) = VW1202 (command register)
 *   Modbus Register 40103 (offset 102) = VW1204
 *   Modbus Register 40111 (offset 110) = VW1220 (item/drink code)
 *   Modbus Register 40112 (offset 111) = VW1222
 *   Modbus Register 40113 (offset 112) = VW1224 (parameter 1 - e.g. sugar)
 *   Modbus Register 40114 (offset 113) = VW1226 (parameter 2 - e.g. size)
 *   Modbus Register 40115 (offset 114) = VW1228 (parameter 3)
 *   Modbus Register 40116 (offset 115) = VW1230 (parameter 4)
 *   Modbus Register 40117 (offset 116) = VW1232 (parameter 5)
 *   Modbus Register 40118 (offset 117) = VW1234 (parameter 6)
 */

// Build Modbus TCP Write Multiple Registers frame (Function Code 0x10)
function buildWriteMultipleRegisters(
  transactionId: number,
  unitId: number,
  startRegister: number,
  values: number[]
): Uint8Array {
  const functionCode = 0x10; // Write Multiple Registers
  const quantity = values.length;
  const byteCount = quantity * 2;
  const length = 7 + byteCount; // Unit ID + FC + Start(2) + Qty(2) + ByteCount + Data

  const buffer = new ArrayBuffer(6 + length);
  const view = new DataView(buffer);

  // MBAP Header
  view.setUint16(0, transactionId);    // Transaction ID
  view.setUint16(2, 0);                // Protocol ID (Modbus = 0)
  view.setUint16(4, length);           // Length
  view.setUint8(6, unitId);            // Unit ID

  // PDU
  view.setUint8(7, functionCode);      // Function Code
  view.setUint16(8, startRegister);    // Starting Address
  view.setUint16(10, quantity);        // Quantity of Registers
  view.setUint8(12, byteCount);        // Byte Count

  // Register Values
  for (let i = 0; i < values.length; i++) {
    view.setInt16(13 + i * 2, values[i]); // Signed 16-bit (S7-200 uses INT)
  }

  return new Uint8Array(buffer);
}

// Build Modbus TCP Read Holding Registers frame (Function Code 0x03)
function buildReadHoldingRegisters(
  transactionId: number,
  unitId: number,
  startRegister: number,
  quantity: number
): Uint8Array {
  const buffer = new ArrayBuffer(12);
  const view = new DataView(buffer);

  view.setUint16(0, transactionId);
  view.setUint16(2, 0);
  view.setUint16(4, 6);       // Length = 6
  view.setUint8(6, unitId);
  view.setUint8(7, 0x03);     // Read Holding Registers
  view.setUint16(8, startRegister);
  view.setUint16(10, quantity);

  return new Uint8Array(buffer);
}

// Parse Modbus TCP response
function parseModbusResponse(data: Uint8Array): { success: boolean; functionCode: number; error?: string; values?: number[] } {
  if (data.length < 9) {
    return { success: false, functionCode: 0, error: "Response too short" };
  }
  const view = new DataView(data.buffer);
  const functionCode = data[7];

  // Error response (function code has high bit set)
  if (functionCode & 0x80) {
    const exceptionCode = data[8];
    const errors: Record<number, string> = {
      1: "Illegal Function",
      2: "Illegal Data Address",
      3: "Illegal Data Value",
      4: "Server Device Failure",
    };
    return { success: false, functionCode, error: errors[exceptionCode] || `Exception ${exceptionCode}` };
  }

  // Write Multiple Registers response (FC 0x10)
  if (functionCode === 0x10) {
    return { success: true, functionCode };
  }

  // Read Holding Registers response (FC 0x03)
  if (functionCode === 0x03) {
    const byteCount = data[8];
    const values: number[] = [];
    for (let i = 0; i < byteCount / 2; i++) {
      values.push(view.getInt16(9 + i * 2));
    }
    return { success: true, functionCode, values };
  }

  return { success: true, functionCode };
}

// Send Modbus TCP frame and get response
async function sendModbusTCP(
  ip: string,
  port: number,
  frame: Uint8Array,
  timeoutMs = 5000
): Promise<{ success: boolean; response?: Uint8Array; error?: string }> {
  try {
    const conn = await Deno.connect({ hostname: ip, port });

    // Set timeout
    const timer = setTimeout(() => {
      try { conn.close(); } catch {}
    }, timeoutMs);

    try {
      // Send frame
      await conn.write(frame);

      // Read response
      const buf = new Uint8Array(256);
      const n = await conn.read(buf);

      clearTimeout(timer);

      if (n === null || n === 0) {
        return { success: false, error: "No response from PLC" };
      }

      return { success: true, response: buf.slice(0, n) };
    } finally {
      clearTimeout(timer);
      try { conn.close(); } catch {}
    }
  } catch (err: any) {
    return { success: false, error: err.message || "TCP connection failed" };
  }
}

// Send order to PLC via Modbus TCP
async function sendOrderToMachine(
  ip: string,
  port: number,
  items: any[],
  orderNumber: string
): Promise<{ success: boolean; details: any; error?: string }> {
  const results: any[] = [];
  let transactionId = 1;

  // For each item in the order, write its plc_code, qty, and params to registers
  for (const item of items) {
    const plcCode = item.plc_code || 0;
    const qty = item.qty || 1;
    const params = item.plcParams || { sugar: 0, size: 0, milk: 0 };

    // Write command registers (40102-40103, offset 101-102)
    const cmdFrame = buildWriteMultipleRegisters(transactionId++, 1, 101, [1, 1]);
    const cmdResult = await sendModbusTCP(ip, port, cmdFrame);

    if (!cmdResult.success) {
      results.push({ item: item.id, step: "command", error: cmdResult.error });
      continue;
    }

    if (cmdResult.response) {
      const parsed = parseModbusResponse(cmdResult.response);
      if (!parsed.success) {
        results.push({ item: item.id, step: "command", error: parsed.error });
        continue;
      }
    }

    await new Promise(r => setTimeout(r, 50));

    // Write item data + parameters (register 110-117 = VW1220-VW1234)
    const itemValues = [
      plcCode,              // VW1220 = item/drink code
      qty,                  // VW1222 = quantity
      params.sugar || 0,    // VW1224 = sugar level (0-3)
      params.size || 0,     // VW1226 = size (1-3)
      params.milk || 0,     // VW1228 = milk type (0-3)
      params.param4 || 0,   // VW1230
      params.param5 || 0,   // VW1232
      params.param6 || 0,   // VW1234
    ];

    const itemFrame = buildWriteMultipleRegisters(transactionId++, 1, 110, itemValues);
    const itemResult = await sendModbusTCP(ip, port, itemFrame);

    if (!itemResult.success) {
      results.push({ item: item.id, step: "item_data", error: itemResult.error });
      continue;
    }

    if (itemResult.response) {
      const parsed = parseModbusResponse(itemResult.response);
      results.push({ item: item.id, plc_code: plcCode, qty, params, success: parsed.success, error: parsed.error });
    } else {
      results.push({ item: item.id, plc_code: plcCode, qty, params, success: true });
    }

    await new Promise(r => setTimeout(r, 100));
  }

  const allSuccess = results.every(r => r.success);
  return { success: allSuccess, details: results, error: allSuccess ? undefined : "Some items failed" };
}

// Ping / check connection via reading a register
async function pingMachine(ip: string, port: number): Promise<boolean> {
  const frame = buildReadHoldingRegisters(1, 1, 0, 1); // Read register 40001
  const result = await sendModbusTCP(ip, port, frame, 3000);
  if (!result.success || !result.response) return false;
  const parsed = parseModbusResponse(result.response);
  return parsed.success;
}

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

    const body = await req.json();
    const { orderNumber, items, total, payment, _ping, _targetMachine } = body;

    // Handle ping/connection check
    if (_ping) {
      const results: any[] = [];
      const targetMachines = _targetMachine
        ? machines.filter((m: any) => m.machineId === _targetMachine)
        : machines;

      for (const machine of targetMachines) {
        const port = parseInt(machine.port) || 502;
        const isConnected = await pingMachine(machine.ip, port);
        results.push({
          machineId: machine.machineId,
          ip: machine.ip,
          success: isConnected,
          protocol: "Modbus TCP",
        });
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check auto-send
    if (!autoSend) {
      return new Response(
        JSON.stringify({ success: false, message: "Auto-send is disabled in PLC settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Send order to all machines via Modbus TCP
    const results: any[] = [];
    for (const machine of machines) {
      const port = parseInt(machine.port) || 502;
      let machineResult;

      try {
        machineResult = await sendOrderToMachine(machine.ip, port, items, orderNumber);
      } catch (err: any) {
        machineResult = { success: false, error: err.message, details: [] };
      }

      results.push({
        machineId: machine.machineId,
        ip: machine.ip,
        port: machine.port,
        protocol: "Modbus TCP",
        success: machineResult.success,
        error: machineResult.error,
        details: machineResult.details,
      });
    }

    const anySuccess = results.some((r: any) => r.success);

    // Log the attempt
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
      protocol: "Modbus TCP",
      registerMapping: {
        VW1202: "Command (register 40102)",
        VW1220: "Item Code (register 40111)",
        VW1222: "Quantity (register 40112)",
      },
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
        message: anySuccess ? "Order sent via Modbus TCP" : "Failed to send to all machines",
        protocol: "Modbus TCP",
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
