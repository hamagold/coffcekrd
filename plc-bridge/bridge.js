#!/usr/bin/env node
/**
 * ============================================
 *   PLC Bridge - پڕۆگرامی پل بۆ PLC
 * ============================================
 * 
 * بەپێی نەخشەی ڕیجیستەرەکان لە فایلی ئێکسەل
 * 
 * ============================================
 *   چۆن بەکاری دەهێنیت:
 * ============================================
 *   1. Node.js دابمەزرێنە
 *   2. cd plc-bridge && npm install
 *   3. فایلی .env دروست بکە
 *   4. node bridge.js
 * ============================================
 */

const net = require('net');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ===== ڕێکخستنەکان =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PLC_IP = process.env.PLC_IP || '192.168.0.50';
const PLC_PORT = parseInt(process.env.PLC_PORT || '502');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '3000');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL و SUPABASE_KEY پێویستن!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Modbus TCP Functions =====

function buildWriteMultipleRegisters(transactionId, unitId, startRegister, values) {
  const quantity = values.length;
  const byteCount = quantity * 2;
  const length = 7 + byteCount;
  const buffer = Buffer.alloc(6 + length);
  buffer.writeUInt16BE(transactionId, 0);
  buffer.writeUInt16BE(0, 2);
  buffer.writeUInt16BE(length, 4);
  buffer.writeUInt8(unitId, 6);
  buffer.writeUInt8(0x10, 7);
  buffer.writeUInt16BE(startRegister, 8);
  buffer.writeUInt16BE(quantity, 10);
  buffer.writeUInt8(byteCount, 12);
  for (let i = 0; i < values.length; i++) {
    buffer.writeInt16BE(values[i], 13 + i * 2);
  }
  return buffer;
}

function buildReadHoldingRegisters(transactionId, unitId, startRegister, quantity) {
  const buffer = Buffer.alloc(12);
  buffer.writeUInt16BE(transactionId, 0);
  buffer.writeUInt16BE(0, 2);
  buffer.writeUInt16BE(6, 4);
  buffer.writeUInt8(unitId, 6);
  buffer.writeUInt8(0x03, 7);
  buffer.writeUInt16BE(startRegister, 8);
  buffer.writeUInt16BE(quantity, 10);
  return buffer;
}

function sendModbusTCP(ip, port, frame, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    let responded = false;
    const timer = setTimeout(() => {
      if (!responded) { responded = true; client.destroy(); resolve({ success: false, error: 'Timeout' }); }
    }, timeoutMs);
    client.connect(port, ip, () => { client.write(frame); });
    client.on('data', (data) => {
      if (!responded) { responded = true; clearTimeout(timer); client.destroy(); resolve({ success: true, response: data }); }
    });
    client.on('error', (err) => {
      if (!responded) { responded = true; clearTimeout(timer); resolve({ success: false, error: err.message }); }
    });
  });
}

function parseModbusResponse(data) {
  if (data.length < 9) return { success: false, error: 'Response too short' };
  const functionCode = data[7];
  if (functionCode & 0x80) {
    const exceptionCode = data[8];
    const errors = { 1: 'Illegal Function', 2: 'Illegal Data Address', 3: 'Illegal Data Value', 4: 'Server Device Failure' };
    return { success: false, error: errors[exceptionCode] || `Exception ${exceptionCode}` };
  }
  if (functionCode === 0x10) return { success: true };
  if (functionCode === 0x03) {
    const byteCount = data[8];
    const values = [];
    for (let i = 0; i < byteCount / 2; i++) values.push(data.readInt16BE(9 + i * 2));
    return { success: true, values };
  }
  return { success: true };
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

/**
 * Register Mapping (from Excel):
 * 
 * WRITE (PC → PLC):
 *   40100 (VW1200) = Heartbeat
 *   40101 (VW1202) = Processing mode: 1=start, 2=cancel, 3=reset
 *   40102 (VW1204) = Device control: 1=reset, 2=clean
 *   40110 (VW1220) = Recipe/drink code (coffee 1-50, milk tea 51-100)
 *   40111 (VW1222) = Latte art print complete: 0=no, 1=done
 *   40112 (VW1224) = Ice: 0=none, 1=less, 2=normal, 3=more
 *   40113 (VW1226) = Latte art: 0=none, 1-3=patterns
 *   40114 (VW1228) = Syrup/sugar type: 1-50 coffee
 *   40115 (VW1230) = Cup type: 1=coffee 8oz, 5=coffee 16oz, 51=tea 12oz, 52=tea 16oz
 *   40116 (VW1232) = Sugar amount: 0=none, 1=less, 2=normal, 3=more
 *   40117 (VW1234) = Topping: 0=none, 51=boba, 52=strawberry, 53=orange, 54=lychee
 * 
 * READ (PLC → PC):
 *   40010 (VW1020) = Device status: 1=processing, 2=standby, 3=fault, 4=not ready, 5=complete
 *   40011 (VW1022) = Mode: 1=manual, 2=local auto, 3=remote auto
 *   40020 (VW1040) = Today's production count
 */

// ===== ناردنی ئۆردەر بۆ PLC =====
async function sendOrderToPLC(order) {
  const items = order.items || [];
  let transactionId = 1;
  const results = [];

  console.log(`\n📦 ئۆردەر #${order.order_number} - ${items.length} ئایتم`);

  for (const item of items) {
    const plcCode = item.plc_code || 0;
    const qty = item.qty || 1;
    const params = item.plcParams || {};

    console.log(`   🔧 ${item.name?.en || item.id} | PLC Code: ${plcCode} | Qty: ${qty}`);
    console.log(`      سەهۆڵ:${params.ice || 0} شەکر:${params.sugar || 0} کوپ:${params.cupType || 0} تۆپینگ:${params.topping || 0} لاتێ ئارت:${params.latteArt || 0}`);

    // Step 1: Write command register 40101 (VW1202) = 1 (start processing)
    const cmdFrame = buildWriteMultipleRegisters(transactionId++, 1, 101, [1]);
    const cmdResult = await sendModbusTCP(PLC_IP, PLC_PORT, cmdFrame);

    if (!cmdResult.success) {
      console.log(`   ❌ فەرمان نەنێردرا: ${cmdResult.error}`);
      results.push({ item: item.id, success: false, error: cmdResult.error });
      continue;
    }
    if (cmdResult.response) {
      const parsed = parseModbusResponse(cmdResult.response);
      if (!parsed.success) {
        console.log(`   ❌ هەڵە: ${parsed.error}`);
        results.push({ item: item.id, success: false, error: parsed.error });
        continue;
      }
    }

    await sleep(50);

    // Step 2: Write recipe data registers 40110-40117 (VW1220-VW1234)
    const itemValues = [
      plcCode,                    // 40110 VW1220 = recipe/drink code
      0,                          // 40111 VW1222 = latte art print complete (0)
      params.ice || 0,            // 40112 VW1224 = ice (0-3)
      params.latteArt || 0,       // 40113 VW1226 = latte art pattern (0-3)
      params.sugarType || 0,      // 40114 VW1228 = syrup/sugar type (1-50)
      params.cupType || 0,        // 40115 VW1230 = cup type
      params.sugar || 0,          // 40116 VW1232 = sugar amount (0-3)
      params.topping || 0,        // 40117 VW1234 = topping
    ];

    const itemFrame = buildWriteMultipleRegisters(transactionId++, 1, 110, itemValues);
    const itemResult = await sendModbusTCP(PLC_IP, PLC_PORT, itemFrame);

    if (itemResult.success && itemResult.response) {
      const parsed = parseModbusResponse(itemResult.response);
      if (parsed.success) {
        console.log(`   ✅ نێردرا بۆ PLC`);
        results.push({ item: item.id, success: true });
      } else {
        console.log(`   ❌ هەڵە: ${parsed.error}`);
        results.push({ item: item.id, success: false, error: parsed.error });
      }
    } else {
      console.log(`   ❌ نەنێردرا: ${itemResult.error}`);
      results.push({ item: item.id, success: false, error: itemResult.error });
    }

    await sleep(100);
  }

  return results.every(r => r.success);
}

// ===== خوێندنەوەی دۆخی PLC =====
async function readPLCStatus() {
  // Read registers 40010-40020 (VW1020-VW1040) = 11 registers
  const frame = buildReadHoldingRegisters(1, 1, 10, 11);
  const result = await sendModbusTCP(PLC_IP, PLC_PORT, frame, 3000);
  if (!result.success) return null;
  const parsed = parseModbusResponse(result.response);
  if (!parsed.success || !parsed.values) return null;
  return {
    deviceStatus: parsed.values[0],    // VW1020
    deviceMode: parsed.values[1],      // VW1022
    robotProgram: parsed.values[2],    // VW1024
    todayCount: parsed.values[10],     // VW1040
  };
}

// ===== پشکنینی پەیوەندی PLC =====
async function pingPLC() {
  const frame = buildReadHoldingRegisters(1, 1, 0, 1);
  const result = await sendModbusTCP(PLC_IP, PLC_PORT, frame, 3000);
  if (!result.success) return false;
  const parsed = parseModbusResponse(result.response);
  return parsed.success;
}

// ===== سەیرکردنی ئۆردەرەکان =====
async function pollOrders() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) { console.error('❌ هەڵەی داتابەیس:', error.message); return; }
    if (!orders || orders.length === 0) return;

    console.log(`\n🔔 ${orders.length} ئۆردەری نوێ دۆزرایەوە!`);

    for (const order of orders) {
      await supabase.from('orders').update({ status: 'preparing' }).eq('id', order.id);
      console.log(`⚙️  ئۆردەر #${order.order_number} - دەنێردرێت بۆ PLC...`);

      const success = await sendOrderToPLC(order);

      if (success) {
        await supabase.from('orders').update({ status: 'done' }).eq('id', order.id);
        console.log(`✅ ئۆردەر #${order.order_number} - تەواو بوو!`);
      } else {
        await supabase.from('orders').update({ status: 'error' }).eq('id', order.id);
        console.log(`❌ ئۆردەر #${order.order_number} - هەڵە!`);
      }
    }
  } catch (err) {
    console.error('❌ هەڵە:', err.message);
  }
}

// ===== دەستپێکردن =====
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       🤖 PLC Bridge - پلی PLC          ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  PLC IP:    ${PLC_IP.padEnd(28)}║`);
  console.log(`║  PLC Port:  ${String(PLC_PORT).padEnd(28)}║`);
  console.log(`║  Poll:      ${(POLL_INTERVAL / 1000 + 's').padEnd(28)}║`);
  console.log('╚══════════════════════════════════════════╝');

  console.log('🔌 پشکنینی پەیوەندی PLC...');
  const plcOk = await pingPLC();
  if (plcOk) {
    console.log('✅ PLC پەیوەستە! (Modbus TCP)');
    const status = await readPLCStatus();
    if (status) {
      const statusNames = { 1: 'کاردەکات', 2: 'ئامادەیە', 3: 'کێشە', 4: 'ئامادە نییە', 5: 'تەواو' };
      const modeNames = { 1: 'دەستی', 2: 'ئۆتۆ ناوخۆ', 3: 'ئۆتۆ دوورادوور' };
      console.log(`   📊 دۆخ: ${statusNames[status.deviceStatus] || status.deviceStatus}`);
      console.log(`   🔧 مۆد: ${modeNames[status.deviceMode] || status.deviceMode}`);
      console.log(`   📈 بەرهەمی ئەمڕۆ: ${status.todayCount}`);
    }
  } else {
    console.log('⚠️  PLC پەیوەست نییە!');
    console.log(`   IP: ${PLC_IP}:${PLC_PORT}`);
  }

  console.log('🔌 پشکنینی داتابەیس...');
  const { error } = await supabase.from('orders').select('id').limit(1);
  if (error) {
    console.error('❌ داتابەیس پەیوەست نییە:', error.message);
    process.exit(1);
  }
  console.log('✅ داتابەیس پەیوەستە!');
  console.log('\n👀 سەیرکردنی ئۆردەرەکان...\n');

  setInterval(pollOrders, POLL_INTERVAL);
  pollOrders();
}

start().catch(err => { console.error('❌ هەڵە:', err.message); process.exit(1); });
