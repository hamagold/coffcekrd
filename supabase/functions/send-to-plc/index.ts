import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Register Mapping (from Excel - YN PLC Variable Table v0.1):
 * 
 * WRITE (PC → PLC):
 *   40100 (offset 100, VW1200) = Heartbeat
 *   40101 (offset 101, VW1202) = Processing: 1=start, 2=cancel, 3=reset
 *   40102 (offset 102, VW1204) = Device control: 1=reset, 2=clean
 *   40110 (offset 110, VW1220) = Recipe/drink code (coffee 1-50, milk tea 51-100)
 *   40111 (offset 111, VW1222) = Latte art print complete: 0=no, 1=done
 *   40112 (offset 112, VW1224) = Ice: 0=none, 1=less, 2=normal, 3=more
 *   40113 (offset 113, VW1226) = Latte art: 0=none, 1-3=patterns
 *   40114 (offset 114, VW1228) = Syrup/sugar type: 1-50
 *   40115 (offset 115, VW1230) = Cup: 1=coffee8oz, 5=coffee16oz, 51=tea12oz, 52=tea16oz
 *   40116 (offset 116, VW1232) = Sugar amount: 0=none, 1=less, 2=normal, 3=more
 *   40117 (offset 117, VW1234) = Topping: 0=none, 51=boba, 52=strawberry, 53=orange, 54=lychee
 * 
 * READ (PLC → PC):
 *   40010 (offset 10, VW1020) = Status: 1=processing, 2=standby, 3=fault, 5=complete
 *   40011 (offset 11, VW1022) = Mode: 1=manual, 2=local auto, 3=remote auto
 */

function buildWriteMultipleRegisters(transactionId: number, unitId: number, startRegister: number, values: number[]): Uint8Array {
  const quantity = values.length;
  const byteCount = quantity * 2;
  const length = 7 + byteCount;
  const buffer = new ArrayBuffer(6 + length);
  const view = new DataView(buffer);
  view.setUint16(0, transactionId);
  view.setUint16(2, 0);
  view.setUint16(4, length);
  view.setUint8(6, unitId);
  view.setUint8(7, 0x10);
  view.setUint16(8, startRegister);
  view.setUint16(10, quantity);
  view.setUint8(12, byteCount);
  for (let i = 0; i < values.length; i++) {
    view.setInt16(13 + i * 2, values[i]);
  }
  return new Uint8Array(buffer);
}

function buildReadHoldingRegisters(transactionId: number, unitId: number, startRegister: number, quantity: number): Uint8Array {
  const buffer = new ArrayBuffer(12);
  const view = new DataView(buffer);
  view.setUint16(0, transactionId);
  view.setUint16(2, 0);
  view.setUint16(4, 6);
  view.setUint8(6, unitId);
  view.setUint8(7, 0x03);
  view.setUint16(8, startRegister);
  view.setUint16(10, quantity);
  return new Uint8Array(buffer);
}

function parseModbusResponse(data: Uint8Array): { success: boolean; functionCode: number; error?: string; values?: number[] } {
  if (data.length < 9) return { success: false, functionCode: 0, error: "Response too short" };
  const view = new DataView(data.buffer);
  const functionCode = data[7];
  if (functionCode & 0x80) {
    const exceptionCode = data[8];
    const errors: Record<number, string> = { 1: "Illegal Function", 2: "Illegal Data Address", 3: "Illegal Data Value", 4: "Server Device Failure" };
    return { success: false, functionCode, error: errors[exceptionCode] || `Exception ${exceptionCode}` };
  }
  if (functionCode === 0x10) return { success: true, functionCode };
  if (functionCode === 0x03) {
    const byteCount = data[8];
    const values: number[] = [];
    for (let i = 0; i < byteCount / 2; i++) values.push(view.getInt16(9 + i * 2));
    return { success: true, functionCode, values };
  }
  return { success: true, functionCode };
}

async function sendModbusTCP(ip: string, port: number, frame: Uint8Array, timeoutMs = 5000): Promise<{ success: boolean; response?: Uint8Array; error?: string }> {
  try {
    const conn = await Deno.connect({ hostname: ip, port });
    const timer = setTimeout(() => { try { conn.close(); } catch {} }, timeoutMs);
    try {
      await conn.write(frame);
      const buf = new Uint8Array(256);
      const n = await conn.read(buf);
      clearTimeout(timer);
      if (n === null || n === 0) return { success: false, error: "No response from PLC" };
      return { success: true, response: buf.slice(0, n) };
    } finally {
      clearTimeout(timer);
      try { conn.close(); } catch {}
    }
  } catch (err: any) {
    return { success: false, error: err.message || "TCP connection failed" };
  }
}

async function sendOrderToMachine(ip: string, port: number, items: any[], orderNumber: string): Promise<{ success: boolean; details: any; error?: string }> {
  const results: any[] = [];
  let transactionId = 1;

  for (const item of items) {
    const plcCode = item.plc_code || 0;
    const params = item.plcParams || {};

    // Step 1: Write command register 40101 (offset 101, VW1202) = 1 (start)
    const cmdFrame = buildWriteMultipleRegisters(transactionId++, 1, 101, [1]);
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

    // Step 2: Write recipe data 40110-40117 (offset 110-117, VW1220-VW1234)
    const itemValues = [
      plcCode,                    // 40110 VW1220 = recipe/drink code
      0,                          // 40111 VW1222 = latte art print complete
      params.ice || 0,            // 40112 VW1224 = ice (0-3)
      params.latteArt || 0,       // 40113 VW1226 = latte art pattern (0-3)
      params.sugarType || 0,      // 40114 VW1228 = syrup/sugar type
      params.cupType || 0,        // 40115 VW1230 = cup type
      params.sugar || 0,          // 40116 VW1232 = sugar amount (0-3)
      params.topping || 0,        // 40117 VW1234 = topping
    ];

    const itemFrame = buildWriteMultipleRegisters(transactionId++, 1, 110, itemValues);
    const itemResult = await sendModbusTCP(ip, port, itemFrame);

    if (!itemResult.success) {
      results.push({ item: item.id, step: "item_data", error: itemResult.error });
      continue;
    }
    if (itemResult.response) {
      const parsed = parseModbusResponse(itemResult.response);
      results.push({ item: item.id, plc_code: plcCode, params, success: parsed.success, error: parsed.error });
    } else {
      results.push({ item: item.id, plc_code: plcCode, params, success: true });
    }

    await new Promise(r => setTimeout(r, 100));
  }

  const allSuccess = results.every(r => r.success);
  return { success: allSuccess, details: results, error: allSuccess ? undefined : "Some items failed" };
}

async function pingMachine(ip: string, port: number): Promise<boolean> {
  const frame = buildReadHoldingRegisters(1, 1, 0, 1);
  const result = await sendModbusTCP(ip, port, frame, 3000);
  if (!result.success || !result.response) return false;
  const parsed = parseModbusResponse(result.response);
  return parsed.success;
}

// Read PLC status registers
async function readMachineStatus(ip: string, port: number): Promise<any> {
  const frame = buildReadHoldingRegisters(1, 1, 10, 11);
  const result = await sendModbusTCP(ip, port, frame, 3000);
  if (!result.success || !result.response) return null;
  const parsed = parseModbusResponse(result.response);
  if (!parsed.success || !parsed.values) return null;
  return {
    deviceStatus: parsed.values[0],  // VW1020
    deviceMode: parsed.values[1],    // VW1022
    robotProgram: parsed.values[2],  // VW1024
    todayCount: parsed.values[10],   // VW1040
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: plcData } = await supabase.from("app_settings").select("value").eq("key", "plc_config").single();
    const rawConfig = (plcData?.value as any) || {};
    const machines = rawConfig.machines || [{ machineId: rawConfig.machineId || "machine-01", ip: rawConfig.ip || "192.168.0.50", port: rawConfig.port || "502" }];
    const autoSend = rawConfig.autoSend || false;

    const body = await req.json();
    const { orderNumber, items, total, payment, _ping, _targetMachine, _readStatus } = body;

    // Handle status read
    if (_readStatus) {
      const results: any[] = [];
      const targetMachines = _targetMachine ? machines.filter((m: any) => m.machineId === _targetMachine) : machines;
      for (const machine of targetMachines) {
        const port = parseInt(machine.port) || 502;
        const isConnected = await pingMachine(machine.ip, port);
        let status = null;
        if (isConnected) status = await readMachineStatus(machine.ip, port);
        results.push({ machineId: machine.machineId, ip: machine.ip, success: isConnected, status, protocol: "Modbus TCP" });
      }
      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle ping
    if (_ping) {
      const results: any[] = [];
      const targetMachines = _targetMachine ? machines.filter((m: any) => m.machineId === _targetMachine) : machines;
      for (const machine of targetMachines) {
        const port = parseInt(machine.port) || 502;
        const isConnected = await pingMachine(machine.ip, port);
        results.push({ machineId: machine.machineId, ip: machine.ip, success: isConnected, protocol: "Modbus TCP" });
      }
      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!autoSend) {
      return new Response(JSON.stringify({ success: false, message: "Auto-send is disabled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];
    for (const machine of machines) {
      const port = parseInt(machine.port) || 502;
      let machineResult;
      try { machineResult = await sendOrderToMachine(machine.ip, port, items, orderNumber); }
      catch (err: any) { machineResult = { success: false, error: err.message, details: [] }; }
      results.push({ machineId: machine.machineId, ip: machine.ip, port: machine.port, protocol: "Modbus TCP", success: machineResult.success, error: machineResult.error, details: machineResult.details });
    }

    const anySuccess = results.some((r: any) => r.success);

    // Log
    const logEntry = {
      orderNumber, itemCount: items.length,
      items: items.map((item: any) => ({ plc_code: item.plc_code, id: item.id, name: item.name?.en || item.id, qty: item.qty })),
      total, protocol: "Modbus TCP",
      registerMapping: { VW1202: "Command (40101)", VW1220: "Recipe (40110)", VW1224: "Ice (40112)", VW1226: "LatteArt (40113)", VW1228: "SugarType (40114)", VW1230: "Cup (40115)", VW1232: "Sugar (40116)", VW1234: "Topping (40117)" },
      machines: results, success: anySuccess, timestamp: new Date().toISOString(),
    };

    const { data: existing } = await supabase.from("app_settings").select("id, value").eq("key", "plc_logs").single();
    const logs = existing ? ((existing.value as any)?.logs || []) : [];
    logs.unshift(logEntry);
    if (logs.length > 50) logs.length = 50;
    if (existing) await supabase.from("app_settings").update({ value: { logs } as any, updated_at: new Date().toISOString() }).eq("key", "plc_logs");
    else await supabase.from("app_settings").insert({ key: "plc_logs", value: { logs } as any });

    return new Response(JSON.stringify({ success: anySuccess, message: anySuccess ? "Order sent via Modbus TCP" : "Failed", protocol: "Modbus TCP", results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
