#!/usr/bin/env node
/**
 * ============================================
 *   PLC Bridge - پڕۆگرامی پل بۆ PLC
 * ============================================
 * 
 * ئەم پڕۆگرامە لەسەر کۆمپیوتەرەکەت ڕایدەکەیت
 * ئەو سەیری ئۆردەرە نوێکان دەکات لە داتابەیس
 * و فەرمان دەنێرێت بۆ PLC لە ڕێگەی Modbus TCP
 * 
 * ============================================
 *   چۆن بەکاری دەهێنیت:
 * ============================================
 * 
 *   1. Node.js دابمەزرێنە (https://nodejs.org)
 *   2. فۆڵدەرەکە بکەرەوە لە terminal:
 *      cd plc-bridge
 *   3. پاکەجەکان دابمەزرێنە:
 *      npm install
 *   4. فایلی .env دروست بکە (سەیری .env.example بکە)
 *   5. پڕۆگرامەکە ڕابکە:
 *      node bridge.js
 * 
 * ============================================
 */

const net = require('net');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ===== ڕێکخستنەکان =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // anon key
const PLC_IP = process.env.PLC_IP || '192.168.1.100';
const PLC_PORT = parseInt(process.env.PLC_PORT || '502');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '3000'); // هەر 3 چرکە

// ===== پشکنینی ڕێکخستنەکان =====
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL و SUPABASE_KEY پێویستن!');
  console.error('   فایلی .env دروست بکە، سەیری .env.example بکە');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Modbus TCP Functions =====

function buildWriteMultipleRegisters(transactionId, unitId, startRegister, values) {
  const quantity = values.length;
  const byteCount = quantity * 2;
  const length = 7 + byteCount;
  const buffer = Buffer.alloc(6 + length);

  // MBAP Header
  buffer.writeUInt16BE(transactionId, 0);
  buffer.writeUInt16BE(0, 2);       // Protocol ID
  buffer.writeUInt16BE(length, 4);   // Length
  buffer.writeUInt8(unitId, 6);      // Unit ID

  // PDU
  buffer.writeUInt8(0x10, 7);                  // Function Code: Write Multiple Registers
  buffer.writeUInt16BE(startRegister, 8);       // Starting Address
  buffer.writeUInt16BE(quantity, 10);           // Quantity
  buffer.writeUInt8(byteCount, 12);             // Byte Count

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
      if (!responded) {
        responded = true;
        client.destroy();
        resolve({ success: false, error: 'Timeout' });
      }
    }, timeoutMs);

    client.connect(port, ip, () => {
      client.write(frame);
    });

    client.on('data', (data) => {
      if (!responded) {
        responded = true;
        clearTimeout(timer);
        client.destroy();
        resolve({ success: true, response: data });
      }
    });

    client.on('error', (err) => {
      if (!responded) {
        responded = true;
        clearTimeout(timer);
        resolve({ success: false, error: err.message });
      }
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
    for (let i = 0; i < byteCount / 2; i++) {
      values.push(data.readInt16BE(9 + i * 2));
    }
    return { success: true, values };
  }
  return { success: true };
}

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
    console.log(`      شەکر:${params.sugar || 0} قەبارە:${params.size || 0} شیر:${params.milk || 0} ڕیسێپی:${params.recipe || 1} ئاو:${params.waterLevel || 2}`);

    // Step 1: Write command registers (40102-40103) = VW1202-VW1204
    const cmdFrame = buildWriteMultipleRegisters(transactionId++, 1, 101, [1, 1]);
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

    // Step 2: Write item data + parameters (register 110-117) = VW1220-VW1234
    const itemValues = [
      plcCode,                    // VW1220 = drink code
      qty,                        // VW1222 = quantity
      params.sugar || 0,          // VW1224 = sugar (0-3)
      params.size || 0,           // VW1226 = size (1-3)
      params.milk || 0,           // VW1228 = milk (0-3)
      params.recipe || 1,         // VW1230 = recipe (1-3)
      params.waterLevel || 2,     // VW1232 = water level (1-3)
      params.param6 || 0,         // VW1234
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

// ===== پشکنینی پەیوەندی PLC =====
async function pingPLC() {
  const frame = buildReadHoldingRegisters(1, 1, 0, 1);
  const result = await sendModbusTCP(PLC_IP, PLC_PORT, frame, 3000);
  if (!result.success) return false;
  const parsed = parseModbusResponse(result.response);
  return parsed.success;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== سەیرکردنی ئۆردەرەکان =====
async function pollOrders() {
  try {
    // ئۆردەرە pending ـەکان بهێنە
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ هەڵەی داتابەیس:', error.message);
      return;
    }

    if (!orders || orders.length === 0) return;

    console.log(`\n🔔 ${orders.length} ئۆردەری نوێ دۆزرایەوە!`);

    for (const order of orders) {
      // ستاتەس بگۆڕە بۆ 'preparing'
      await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', order.id);

      console.log(`⚙️  ئۆردەر #${order.order_number} - دەنێردرێت بۆ PLC...`);

      const success = await sendOrderToPLC(order);

      if (success) {
        // ستاتەس بگۆڕە بۆ 'done'
        await supabase
          .from('orders')
          .update({ status: 'done' })
          .eq('id', order.id);

        console.log(`✅ ئۆردەر #${order.order_number} - تەواو بوو!`);
      } else {
        // ستاتەس بگۆڕە بۆ 'error'
        await supabase
          .from('orders')
          .update({ status: 'error' })
          .eq('id', order.id);

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
  console.log('');

  // پشکنینی PLC
  console.log('🔌 پشکنینی پەیوەندی PLC...');
  const plcOk = await pingPLC();
  if (plcOk) {
    console.log('✅ PLC پەیوەستە! (Modbus TCP)');
  } else {
    console.log('⚠️  PLC پەیوەست نییە! پڕۆگرام بەردەوام دەبێت...');
    console.log(`   دڵنیابە لەوەی PLC ـەکەت ڕوونە و IP: ${PLC_IP}:${PLC_PORT} ڕاستە`);
  }

  // پشکنینی داتابەیس
  console.log('🔌 پشکنینی داتابەیس...');
  const { data, error } = await supabase.from('orders').select('id').limit(1);
  if (error) {
    console.error('❌ داتابەیس پەیوەست نییە:', error.message);
    console.error('   SUPABASE_URL و SUPABASE_KEY بپشکنە');
    process.exit(1);
  }
  console.log('✅ داتابەیس پەیوەستە!');

  console.log('');
  console.log('👀 سەیرکردنی ئۆردەرەکان دەستی پێکرد...');
  console.log('   (Ctrl+C بۆ وەستاندن)');
  console.log('');

  // هەر X چرکەیەک سەیری ئۆردەرەکان بکە
  setInterval(pollOrders, POLL_INTERVAL);
  // یەکەم جار ئێستا ڕابکە
  pollOrders();
}

start().catch(err => {
  console.error('❌ هەڵەی دەستپێکردن:', err.message);
  process.exit(1);
});
