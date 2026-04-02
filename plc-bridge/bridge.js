#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        🤖 PLC Bridge v2.0 - Modbus TCP                 ║
 * ║        Siemens S7-200 Smart + Robot Control             ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  چۆن بەکاری دەهێنیت:                                   ║
 * ║  1. فایلی .env دروست بکە (لە .env.example کۆپی بکە)    ║
 * ║  2. npm install                                         ║
 * ║  3. node bridge.js                                      ║
 * ╚══════════════════════════════════════════════════════════╝
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

// ===== پشکنینی ڕێکخستنەکان =====
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('');
  console.error('❌ هەڵە: SUPABASE_URL و SUPABASE_KEY پێویستن!');
  console.error('   تکایە فایلی .env دروست بکە لە .env.example');
  console.error('');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== ئاماری کار =====
let stats = {
  startTime: new Date(),
  ordersProcessed: 0,
  ordersFailed: 0,
  plcConnected: false,
  dbConnected: false,
  lastOrderTime: null,
  lastError: null,
};

// ===== Modbus TCP Helper Functions =====

/**
 * دروستکردنی فرەیمی نووسین بۆ چەندین ڕیجیستەر (Function Code 0x10)
 */
function buildWriteMultipleRegisters(transactionId, unitId, startRegister, values) {
  const quantity = values.length;
  const byteCount = quantity * 2;
  const length = 7 + byteCount;
  const buffer = Buffer.alloc(6 + length);

  // MBAP Header
  buffer.writeUInt16BE(transactionId, 0); // Transaction ID
  buffer.writeUInt16BE(0, 2);             // Protocol ID (0 = Modbus)
  buffer.writeUInt16BE(length, 4);        // Length
  buffer.writeUInt8(unitId, 6);           // Unit ID

  // PDU
  buffer.writeUInt8(0x10, 7);                    // Function Code: Write Multiple Registers
  buffer.writeUInt16BE(startRegister, 8);        // Starting Register
  buffer.writeUInt16BE(quantity, 10);            // Quantity of Registers
  buffer.writeUInt8(byteCount, 12);              // Byte Count

  for (let i = 0; i < values.length; i++) {
    buffer.writeInt16BE(values[i], 13 + i * 2);  // Register Values
  }

  return buffer;
}

/**
 * دروستکردنی فرەیمی خوێندنەوە بۆ ڕیجیستەرەکان (Function Code 0x03)
 */
function buildReadHoldingRegisters(transactionId, unitId, startRegister, quantity) {
  const buffer = Buffer.alloc(12);

  // MBAP Header
  buffer.writeUInt16BE(transactionId, 0);
  buffer.writeUInt16BE(0, 2);
  buffer.writeUInt16BE(6, 4);
  buffer.writeUInt8(unitId, 6);

  // PDU
  buffer.writeUInt8(0x03, 7);                    // Function Code: Read Holding Registers
  buffer.writeUInt16BE(startRegister, 8);        // Starting Register
  buffer.writeUInt16BE(quantity, 10);            // Quantity

  return buffer;
}

/**
 * ناردنی فرەیم بە TCP بۆ PLC
 */
function sendModbusTCP(ip, port, frame, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    let responded = false;

    const timer = setTimeout(() => {
      if (!responded) {
        responded = true;
        client.destroy();
        resolve({ success: false, error: 'Timeout - PLC وەڵام نەدایەوە' });
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
        client.destroy();
        resolve({ success: false, error: err.message });
      }
    });
  });
}

/**
 * شیکردنەوەی وەڵامی Modbus
 */
function parseModbusResponse(data) {
  if (data.length < 9) return { success: false, error: 'وەڵام کورتە' };

  const functionCode = data[7];

  // Exception response
  if (functionCode & 0x80) {
    const exceptionCode = data[8];
    const errors = {
      1: 'Illegal Function - فەنکشنی نادروست',
      2: 'Illegal Data Address - ناونیشانی نادروست',
      3: 'Illegal Data Value - بەهای نادروست',
      4: 'Server Device Failure - کێشەی ئامێر',
    };
    return { success: false, error: errors[exceptionCode] || `Exception ${exceptionCode}` };
  }

  // Write Multiple Registers Response (0x10)
  if (functionCode === 0x10) return { success: true };

  // Read Holding Registers Response (0x03)
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * ══════════════════════════════════════════════════════
 *  نەخشەی ڕیجیستەرەکان (لە فایلی ئێکسەل)
 * ══════════════════════════════════════════════════════
 *
 * WRITE (PC → PLC):
 * ┌──────────┬──────────┬───────────────────────────────────────────────────┐
 * │ Register │ V Memory │ بەکارهاتن                                        │
 * ├──────────┼──────────┼───────────────────────────────────────────────────┤
 * │ 40100    │ VW1200   │ Heartbeat                                        │
 * │ 40101    │ VW1202   │ فەرمان: 1=دەستپێکردن، 2=هەڵوەشاندنەوە، 3=ڕیسێت │
 * │ 40102    │ VW1204   │ کۆنترۆڵی ئامێر: 1=ڕیسێت، 2=شوشتن               │
 * │ 40110    │ VW1220   │ کۆدی ڕیسێپی (قاوە 1-50, چای 51-100)             │
 * │ 40111    │ VW1222   │ لاتێ ئارت چاپ تەواو: 0=نا، 1=بەڵێ               │
 * │ 40112    │ VW1224   │ سەهۆڵ: 0=بێ، 1=کەم، 2=ئاسایی، 3=زۆر            │
 * │ 40113    │ VW1226   │ لاتێ ئارت: 0=بێ، 1-3=شێوە                       │
 * │ 40114    │ VW1228   │ جۆری شیرە/شەکر: 1-50                             │
 * │ 40115    │ VW1230   │ کوپ: 1=8oz، 5=16oz، 51=12oz، 52=16oz            │
 * │ 40116    │ VW1232   │ بڕی شەکر: 0=بێ، 1=کەم، 2=ئاسایی، 3=زۆر        │
 * │ 40117    │ VW1234   │ تۆپینگ: 0=بێ، 51=بۆبا، 52=فراولە، 53=پرتەقاڵ   │
 * └──────────┴──────────┴───────────────────────────────────────────────────┘
 *
 * READ (PLC → PC):
 * ┌──────────┬──────────┬───────────────────────────────────────────────────┐
 * │ 40010    │ VW1020   │ دۆخ: 1=کار، 2=ئامادە، 3=کێشە، 4=ئامادە نییە، 5=تەواو │
 * │ 40011    │ VW1022   │ مۆد: 1=دەستی، 2=ئۆتۆ ناوخۆ، 3=ئۆتۆ دوور        │
 * │ 40020    │ VW1040   │ ژمارەی بەرهەمی ئەمڕۆ                            │
 * └──────────┴──────────┴───────────────────────────────────────────────────┘
 *
 * IP ـی ئامێرەکان:
 *   PLC:     192.168.0.50  (Port 502)
 *   HMI:     192.168.0.51
 *   ROBOT 1: 192.168.0.52
 *   ROBOT 2: 192.168.0.53
 *   IPC:     192.168.0.20
 */

// ═══════════════════════════════════════
//  ناردنی ئۆردەر بۆ PLC
// ═══════════════════════════════════════
async function sendOrderToPLC(order) {
  const items = order.items || [];
  let transactionId = 1;
  const results = [];

  console.log(`\n📦 ئۆردەر #${order.order_number} — ${items.length} ئایتم — ${order.total} IQD`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const plcCode = item.plc_code || 0;
    const qty = item.qty || 1;
    const params = item.plcParams || {};

    console.log(`   [${i + 1}/${items.length}] ${item.name?.ku || item.name?.en || item.id}`);
    console.log(`       PLC Code: ${plcCode} | Qty: ${qty}`);
    console.log(`       سەهۆڵ:${params.ice || 0} شەکر:${params.sugar || 0} کوپ:${params.cupType || 0} تۆپینگ:${params.topping || 0} لاتێ:${params.latteArt || 0}`);

    // بۆ هەر یەک لە qty
    for (let q = 0; q < qty; q++) {
      if (qty > 1) console.log(`       ⏳ دانەی ${q + 1}/${qty}...`);

      // ─── هەنگاوی ١: فەرمانی دەستپێکردن → VW1202 (40101) = 1 ───
      const cmdFrame = buildWriteMultipleRegisters(transactionId++, 1, 101, [1]);
      const cmdResult = await sendModbusTCP(PLC_IP, PLC_PORT, cmdFrame);

      if (!cmdResult.success) {
        console.log(`       ❌ فەرمان نەنێردرا: ${cmdResult.error}`);
        stats.lastError = cmdResult.error;
        results.push({ item: item.id, success: false, error: cmdResult.error });
        continue;
      }

      if (cmdResult.response) {
        const parsed = parseModbusResponse(cmdResult.response);
        if (!parsed.success) {
          console.log(`       ❌ هەڵە لە فەرمان: ${parsed.error}`);
          stats.lastError = parsed.error;
          results.push({ item: item.id, success: false, error: parsed.error });
          continue;
        }
      }

      await sleep(50);

      // ─── هەنگاوی ٢: داتای ڕیسێپی → VW1220-VW1234 (40110-40117) ───
      const itemValues = [
        plcCode,                    // 40110 VW1220 = کۆدی ڕیسێپی
        0,                          // 40111 VW1222 = لاتێ ئارت چاپ (0)
        params.ice || 0,            // 40112 VW1224 = سەهۆڵ (0-3)
        params.latteArt || 0,       // 40113 VW1226 = لاتێ ئارت (0-3)
        params.sugarType || 0,      // 40114 VW1228 = جۆری شیرە (1-50)
        params.cupType || 0,        // 40115 VW1230 = جۆری کوپ
        params.sugar || 0,          // 40116 VW1232 = بڕی شەکر (0-3)
        params.topping || 0,        // 40117 VW1234 = تۆپینگ
      ];

      const itemFrame = buildWriteMultipleRegisters(transactionId++, 1, 110, itemValues);
      const itemResult = await sendModbusTCP(PLC_IP, PLC_PORT, itemFrame);

      if (itemResult.success && itemResult.response) {
        const parsed = parseModbusResponse(itemResult.response);
        if (parsed.success) {
          console.log(`       ✅ نێردرا بۆ PLC — [${itemValues.join(', ')}]`);
          results.push({ item: item.id, success: true });
        } else {
          console.log(`       ❌ هەڵە: ${parsed.error}`);
          stats.lastError = parsed.error;
          results.push({ item: item.id, success: false, error: parsed.error });
        }
      } else {
        console.log(`       ❌ نەنێردرا: ${itemResult.error}`);
        stats.lastError = itemResult.error;
        results.push({ item: item.id, success: false, error: itemResult.error });
      }

      // ئەگەر زیاتر لە یەک دانە بوو، چاوەڕێ بکە تا تەواو ببێت
      if (qty > 1 && q < qty - 1) {
        console.log(`       ⏳ چاوەڕوانی تەواوبوون...`);
        await waitForPLCComplete(30000); // 30 چرکە چاوەڕوان بە
      }

      await sleep(100);
    }
  }

  return results.every(r => r.success);
}

// ═══════════════════════════════════════
//  چاوەڕوانی تەواوبوونی PLC
// ═══════════════════════════════════════
async function waitForPLCComplete(maxWaitMs = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const status = await readPLCStatus();
    if (status && status.deviceStatus === 2) return true;  // 2 = Standby/ئامادە
    if (status && status.deviceStatus === 5) return true;  // 5 = Complete/تەواو
    await sleep(1000);
  }
  console.log('       ⚠️  ماوەی چاوەڕوانی تەواو بوو');
  return false;
}

// ═══════════════════════════════════════
//  خوێندنەوەی دۆخی PLC
// ═══════════════════════════════════════
async function readPLCStatus() {
  const frame = buildReadHoldingRegisters(1, 1, 10, 11);
  const result = await sendModbusTCP(PLC_IP, PLC_PORT, frame, 3000);
  if (!result.success) return null;

  const parsed = parseModbusResponse(result.response);
  if (!parsed.success || !parsed.values) return null;

  return {
    deviceStatus: parsed.values[0],    // VW1020: 1=کار، 2=ئامادە، 3=کێشە، 5=تەواو
    deviceMode: parsed.values[1],      // VW1022: 1=دەستی، 2=ئۆتۆ ناوخۆ، 3=دوور
    robotProgram: parsed.values[2],    // VW1024
    todayCount: parsed.values[10],     // VW1040: بەرهەمی ئەمڕۆ
  };
}

// ═══════════════════════════════════════
//  Ping بۆ PLC
// ═══════════════════════════════════════
async function pingPLC() {
  const frame = buildReadHoldingRegisters(1, 1, 0, 1);
  const result = await sendModbusTCP(PLC_IP, PLC_PORT, frame, 3000);
  if (!result.success) return false;
  const parsed = parseModbusResponse(result.response);
  return parsed.success;
}

// ═══════════════════════════════════════
//  سەیرکردنی ئۆردەرەکان (Polling)
// ═══════════════════════════════════════
async function pollOrders() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ هەڵەی داتابەیس:', error.message);
      stats.dbConnected = false;
      return;
    }

    stats.dbConnected = true;

    if (!orders || orders.length === 0) return;

    console.log(`\n🔔 ${orders.length} ئۆردەری نوێ دۆزرایەوە!`);
    console.log('─'.repeat(50));

    for (const order of orders) {
      // ستاتەس بگۆڕە بۆ preparing
      await supabase.from('orders').update({ status: 'preparing' }).eq('id', order.id);
      console.log(`⚙️  ئۆردەر #${order.order_number} — دەنێردرێت بۆ PLC...`);

      const success = await sendOrderToPLC(order);

      if (success) {
        await supabase.from('orders').update({ status: 'done' }).eq('id', order.id);
        stats.ordersProcessed++;
        stats.lastOrderTime = new Date();
        console.log(`✅ ئۆردەر #${order.order_number} — تەواو بوو!`);
      } else {
        await supabase.from('orders').update({ status: 'error' }).eq('id', order.id);
        stats.ordersFailed++;
        console.log(`❌ ئۆردەر #${order.order_number} — هەڵە!`);
      }

      console.log('─'.repeat(50));
    }
  } catch (err) {
    console.error('❌ هەڵەی گشتی:', err.message);
    stats.lastError = err.message;
  }
}

// ═══════════════════════════════════════
//  نیشاندانی ئامار
// ═══════════════════════════════════════
function showStats() {
  const uptime = Math.floor((Date.now() - stats.startTime.getTime()) / 1000);
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const secs = uptime % 60;

  console.log(`\n📊 ئامار: ${hours}h ${mins}m ${secs}s | ✅ ${stats.ordersProcessed} تەواو | ❌ ${stats.ordersFailed} هەڵە | PLC: ${stats.plcConnected ? '🟢' : '🔴'} | DB: ${stats.dbConnected ? '🟢' : '🔴'}`);
}

// ═══════════════════════════════════════
//  دەستپێکردنی پڕۆگرام
// ═══════════════════════════════════════
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║          🤖 PLC Bridge v2.0 — Modbus TCP            ║');
  console.log('║          Siemens S7-200 Smart + Robot               ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  PLC IP:      ${PLC_IP.padEnd(40)}║`);
  console.log(`║  PLC Port:    ${String(PLC_PORT).padEnd(40)}║`);
  console.log(`║  Poll:        ${(POLL_INTERVAL / 1000 + ' چرکە').padEnd(40)}║`);
  console.log(`║  کات:         ${new Date().toLocaleString('en-GB').padEnd(40)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  // ─── پشکنینی داتابەیس ───
  console.log('\n🔌 پشکنینی داتابەیس...');
  const { error } = await supabase.from('orders').select('id').limit(1);
  if (error) {
    console.error('❌ داتابەیس پەیوەست نییە:', error.message);
    console.error('   تکایە SUPABASE_URL و SUPABASE_KEY پشکنین بکەرەوە');
    process.exit(1);
  }
  console.log('✅ داتابەیس پەیوەستە!');
  stats.dbConnected = true;

  // ─── پشکنینی PLC ───
  console.log('\n🔌 پشکنینی PLC...');
  const plcOk = await pingPLC();
  stats.plcConnected = plcOk;

  if (plcOk) {
    console.log(`✅ PLC پەیوەستە! (${PLC_IP}:${PLC_PORT})`);

    const status = await readPLCStatus();
    if (status) {
      const statusNames = { 1: '🔄 کاردەکات', 2: '✅ ئامادەیە', 3: '⚠️ کێشە', 4: '🔴 ئامادە نییە', 5: '✅ تەواو' };
      const modeNames = { 1: '🖐️ دەستی', 2: '🔄 ئۆتۆ ناوخۆ', 3: '🌐 ئۆتۆ دوورادوور' };
      console.log(`   📊 دۆخ:    ${statusNames[status.deviceStatus] || 'نەزانراو (' + status.deviceStatus + ')'}`);
      console.log(`   🔧 مۆد:    ${modeNames[status.deviceMode] || 'نەزانراو (' + status.deviceMode + ')'}`);
      console.log(`   📈 بەرهەم: ${status.todayCount} دانە ئەمڕۆ`);

      if (status.deviceMode !== 3) {
        console.log('');
        console.log('   ⚠️  ئاگاداری: PLC لە مۆدی "ئۆتۆ دوورادوور" نییە!');
        console.log('   ⚠️  تکایە لە HMI مۆدەکە بگۆڕە بۆ "Remote Auto" (3)');
      }
    }
  } else {
    console.log(`⚠️  PLC پەیوەست نییە! (${PLC_IP}:${PLC_PORT})`);
    console.log('   ئۆردەرەکان هەڵدەگیرێن تا PLC پەیوەست ببێت');
    console.log('');
    console.log('   پشکنین بکە:');
    console.log(`   1. ئایا PLC ڕۆشنە؟ (IP: ${PLC_IP})`);
    console.log(`   2. ئایا کۆمپیوتەرەکەت لە هەمان نێتوۆرکە؟ (192.168.0.x)`);
    console.log('   3. ئایا پۆرت 502 کراوەیە لە PLC؟');
    console.log(`   4. تاقی بکەرەوە: node test-connection.js`);
  }

  // ─── دەستپێکردنی چاودێری ───
  console.log('\n' + '═'.repeat(55));
  console.log('👀 چاودێری ئۆردەرەکان دەستیپێکرد...');
  console.log('   Ctrl+C بۆ وەستان');
  console.log('═'.repeat(55));

  // Poll هەر x چرکەیەک
  setInterval(pollOrders, POLL_INTERVAL);
  pollOrders();

  // ئامار هەر 60 چرکەیەک
  setInterval(showStats, 60000);

  // هەر 30 چرکەیەک پشکنینی PLC
  setInterval(async () => {
    stats.plcConnected = await pingPLC();
  }, 30000);
}

// ═══════════════════════════════════════
//  هەڵکەوتنی هەڵە
// ═══════════════════════════════════════
process.on('uncaughtException', (err) => {
  console.error('❌ هەڵەی نەخوازراو:', err.message);
  stats.lastError = err.message;
});

process.on('unhandledRejection', (err) => {
  console.error('❌ هەڵەی Promise:', err);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 بەخێرهاتنەوە! پڕۆگرام وەستا.');
  showStats();
  process.exit(0);
});

// دەستپێکردن
start().catch(err => {
  console.error('❌ هەڵەی دەستپێکردن:', err.message);
  process.exit(1);
});
