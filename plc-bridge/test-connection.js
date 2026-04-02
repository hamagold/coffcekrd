#!/usr/bin/env node
/**
 * تاقیکردنەوەی کۆنیکشن بۆ PLC و داتابەیس
 * بەکارهێنان: node test-connection.js
 */

const net = require('net');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const PLC_IP = process.env.PLC_IP || '192.168.0.50';
const PLC_PORT = parseInt(process.env.PLC_PORT || '502');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║    🔧 تاقیکردنەوەی کۆنیکشنەکان         ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

async function testPLC() {
  console.log(`1️⃣  PLC (${PLC_IP}:${PLC_PORT})...`);

  return new Promise((resolve) => {
    const client = new net.Socket();
    const timer = setTimeout(() => {
      client.destroy();
      console.log('   🔴 PLC پەیوەست نییە (Timeout)');
      console.log(`      → ئایا IP ـەکە ڕاستە؟ (${PLC_IP})`);
      console.log('      → ئایا لە هەمان نێتوۆرکیت؟ (192.168.0.x)');
      console.log('      → ئایا PLC ڕۆشنە؟');
      resolve(false);
    }, 5000);

    client.connect(PLC_PORT, PLC_IP, () => {
      clearTimeout(timer);

      // ناردنی Read Holding Registers بۆ تاقیکردنەوە
      const frame = Buffer.alloc(12);
      frame.writeUInt16BE(1, 0);    // Transaction ID
      frame.writeUInt16BE(0, 2);    // Protocol
      frame.writeUInt16BE(6, 4);    // Length
      frame.writeUInt8(1, 6);       // Unit ID
      frame.writeUInt8(0x03, 7);    // Function: Read Holding Registers
      frame.writeUInt16BE(10, 8);   // Start Register (VW1020)
      frame.writeUInt16BE(2, 10);   // Quantity (2 registers)

      client.write(frame);
    });

    client.on('data', (data) => {
      clearTimeout(timer);
      client.destroy();

      if (data.length >= 9) {
        const functionCode = data[7];
        if (functionCode === 0x03 && data.length >= 13) {
          const deviceStatus = data.readInt16BE(9);
          const deviceMode = data.readInt16BE(11);

          const statusNames = { 1: 'کاردەکات', 2: 'ئامادەیە', 3: 'کێشە', 4: 'ئامادە نییە', 5: 'تەواو' };
          const modeNames = { 1: 'دەستی', 2: 'ئۆتۆ ناوخۆ', 3: 'ئۆتۆ دوورادوور' };

          console.log('   🟢 PLC پەیوەستە!');
          console.log(`      دۆخ: ${statusNames[deviceStatus] || deviceStatus}`);
          console.log(`      مۆد: ${modeNames[deviceMode] || deviceMode}`);

          if (deviceMode !== 3) {
            console.log('      ⚠️  مۆد لە "ئۆتۆ دوورادوور" نییە — تکایە لە HMI بیگۆڕە');
          }
        } else if (functionCode & 0x80) {
          console.log('   🟡 PLC پەیوەستە بەڵام هەڵەی Modbus هەیە');
        } else {
          console.log('   🟢 PLC پەیوەستە!');
        }
        resolve(true);
      } else {
        console.log('   🟡 PLC وەڵامی کورتی دایەوە');
        resolve(true);
      }
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      client.destroy();
      console.log(`   🔴 PLC پەیوەست نییە: ${err.message}`);

      if (err.message.includes('ECONNREFUSED')) {
        console.log('      → پۆرت 502 نەدۆزرایەوە — PLC ڕۆشنە؟');
      } else if (err.message.includes('ETIMEDOUT') || err.message.includes('EHOSTUNREACH')) {
        console.log('      → IP نەدۆزرایەوە — لە هەمان نێتوۆرکیت؟');
      } else if (err.message.includes('ENETUNREACH')) {
        console.log('      → نێتوۆرک نییە — وایفای/LAN پشکنین بکە');
      }

      resolve(false);
    });
  });
}

async function testDatabase() {
  console.log(`\n2️⃣  داتابەیس...`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('   🔴 SUPABASE_URL یان SUPABASE_KEY لە فایلی .env نییە');
    return false;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('orders').select('id, status').limit(5);

    if (error) {
      console.log(`   🔴 هەڵەی داتابەیس: ${error.message}`);
      return false;
    }

    console.log('   🟢 داتابەیس پەیوەستە!');

    const pending = (data || []).filter(o => o.status === 'pending').length;
    const preparing = (data || []).filter(o => o.status === 'preparing').length;
    console.log(`      ئۆردەری چاوەڕوان: ${pending} | ئامادەکردن: ${preparing}`);

    return true;
  } catch (err) {
    console.log(`   🔴 هەڵە: ${err.message}`);
    return false;
  }
}

async function testNetwork() {
  console.log(`\n3️⃣  نێتوۆرکی ناوخۆیی...`);

  // تاقیکردنەوەی IP ـی ئامێرەکان
  const devices = [
    { name: 'PLC', ip: '192.168.0.50' },
    { name: 'HMI', ip: '192.168.0.51' },
    { name: 'ROBOT 1', ip: '192.168.0.52' },
    { name: 'ROBOT 2', ip: '192.168.0.53' },
  ];

  for (const device of devices) {
    const reachable = await new Promise((resolve) => {
      const client = new net.Socket();
      const timer = setTimeout(() => { client.destroy(); resolve(false); }, 2000);
      client.connect(502, device.ip, () => {
        clearTimeout(timer);
        client.destroy();
        resolve(true);
      });
      client.on('error', () => { clearTimeout(timer); client.destroy(); resolve(false); });
    });

    console.log(`   ${reachable ? '🟢' : '⚪'} ${device.name.padEnd(10)} ${device.ip} ${reachable ? '— پەیوەستە' : '— نەدۆزرایەوە'}`);
  }
}

async function run() {
  const plcOk = await testPLC();
  const dbOk = await testDatabase();
  await testNetwork();

  console.log('\n' + '═'.repeat(45));
  console.log('📋 ئەنجام:');
  console.log(`   PLC:      ${plcOk ? '🟢 ئامادەیە' : '🔴 پەیوەست نییە'}`);
  console.log(`   داتابەیس: ${dbOk ? '🟢 ئامادەیە' : '🔴 پەیوەست نییە'}`);

  if (plcOk && dbOk) {
    console.log('\n   ✅ هەموو شت ئامادەیە! دەتوانیت bridge بڕەنیت:');
    console.log('      node bridge.js');
  } else {
    console.log('\n   ⚠️  تکایە کێشەکان چارەسەر بکە پێش ڕەنکردنی bridge');
  }

  console.log('═'.repeat(45));
  console.log('');
  process.exit(0);
}

run().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
