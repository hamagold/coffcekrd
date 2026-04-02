import { useState, useEffect, useCallback } from 'react';
import { Cpu, Wifi, WifiOff, Save, Play, ToggleLeft, ToggleRight, Loader2, Plus, Trash2, Hash, Circle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { supabase } from '@/integrations/supabase/client';

interface PLCMachine {
  machineId: string;
  name: string;
  ip: string;
  port: string;
  model: string;
  protocol: string;
}

interface PLCConfig {
  autoSend: boolean;
  machines: PLCMachine[];
  ip?: string;
  port?: string;
  model?: string;
  protocol?: string;
  machineId?: string;
}

interface PLCItem {
  id: string;
  item_id: string;
  name_en: string;
  name_ku: string;
  cat: string;
  menu_type: string;
  plc_code: number;
}

const DEFAULT_MACHINE: PLCMachine = {
  machineId: 'machine-01',
  name: 'Robot 1',
  ip: '192.168.0.50',
  port: '502',
  model: 'Siemens S7-200 Smart',
  protocol: 'Modbus TCP',
};

const DEFAULT_CONFIG: PLCConfig = {
  autoSend: false,
  machines: [
    { ...DEFAULT_MACHINE },
    { machineId: 'machine-02', name: 'Robot 2', ip: '192.168.0.52', port: '502', model: 'Siemens S7-200 Smart', protocol: 'Modbus TCP' },
    { machineId: 'machine-03', name: 'Robot 3', ip: '192.168.0.53', port: '502', model: 'Siemens S7-200 Smart', protocol: 'Modbus TCP' },
  ],
};

let cachedPLCConfig: PLCConfig | null = null;

const migrateConfig = (raw: any): PLCConfig => {
  if (raw?.machines) return raw as PLCConfig;
  return {
    autoSend: raw?.autoSend || false,
    machines: [{
      machineId: raw?.machineId || 'machine-01',
      name: 'Robot 1',
      ip: raw?.ip || '192.168.1.100',
      port: raw?.port || '502',
      model: raw?.model || 'Siemens S7-1200',
      protocol: raw?.protocol || 'Modbus TCP',
    }],
  };
};

export const fetchPLCConfig = async (): Promise<PLCConfig> => {
  if (cachedPLCConfig) return cachedPLCConfig;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'plc_config')
    .single();
  cachedPLCConfig = migrateConfig(data?.value) || DEFAULT_CONFIG;
  return cachedPLCConfig!;
};

export const invalidatePLCCache = () => {
  cachedPLCConfig = null;
};

/* ─── PLC Item Codes Sub-Component ─── */
const PLCItemCodes = ({ lang }: { lang: Language }) => {
  const [items, setItems] = useState<PLCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('id, item_id, name_en, name_ku, cat, menu_type, plc_code')
      .eq('menu_type', 'robot')
      .order('sort_order', { ascending: true });
    if (data) setItems(data as PLCItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const updateCode = (idx: number, code: number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], plc_code: code };
      return updated;
    });
  };

  const saveAllCodes = async () => {
    setSaving(true);
    try {
      for (const item of items) {
        await supabase.from('menu_items').update({ plc_code: item.plc_code } as any).eq('id', item.id);
      }
      toast.success(lang === 'ku' ? 'کۆدەکان پاشکەوت کران' : lang === 'ar' ? 'تم حفظ الأكواد' : 'PLC codes saved');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          <span className="text-foreground font-bold text-sm">
            {lang === 'ku' ? 'کۆدی PLC بۆ ئایتمەکان (ڕۆبۆت)' : lang === 'ar' ? 'أكواد PLC للعناصر (روبوت)' : 'PLC Codes for Items (Robot)'}
          </span>
        </div>
        <button
          onClick={saveAllCodes}
          disabled={saving}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {lang === 'ku' ? 'پاشکەوت' : lang === 'ar' ? 'حفظ' : 'Save'}
        </button>
      </div>
      <div className="divide-y divide-border">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors">
            <div className="w-12 h-8 bg-primary/10 rounded-md flex items-center justify-center">
              <input
                type="number"
                min={0}
                value={item.plc_code}
                onChange={e => updateCode(idx, parseInt(e.target.value) || 0)}
                className="w-full h-full text-center bg-transparent text-primary font-bold text-sm focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground text-sm font-semibold truncate">{lang === 'ku' ? item.name_ku : item.name_en}</div>
              <div className="text-muted-foreground text-[10px] font-mono">{item.item_id} · {item.cat}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-secondary/30 text-center">
        <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
          {lang === 'ku' ? 'ئەم کۆدانە بۆ ناسینەوەی ئایتمەکان لە لایەن ئامێری PLC بەکاردێن' : lang === 'ar' ? 'هذه الأكواد تستخدم لتعريف العناصر في جهاز PLC' : 'These codes identify items for PLC machines'}
        </span>
      </div>
    </div>
  );
};

type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'disconnected';

/* ─── Main AdminPLC Component ─── */
const AdminPLC = ({ lang }: { lang: Language }) => {
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  const [config, setConfig] = useState<PLCConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>({});

  useEffect(() => {
    fetchPLCConfig().then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const updateMachine = (idx: number, field: keyof PLCMachine, value: string) => {
    setConfig(prev => {
      const machines = [...prev.machines];
      machines[idx] = { ...machines[idx], [field]: value };
      return { ...prev, machines };
    });
  };

  const addMachine = () => {
    const num = config.machines.length + 1;
    setConfig(prev => ({
      ...prev,
      machines: [...prev.machines, {
        machineId: `machine-${String(num).padStart(2, '0')}`,
        name: `Robot ${num}`,
        ip: `192.168.1.${99 + num}`,
        port: '502',
        model: 'Siemens S7-1200',
        protocol: 'Modbus TCP',
      }],
    }));
    setExpandedIdx(config.machines.length);
  };

  const removeMachine = (idx: number) => {
    if (config.machines.length <= 1) return;
    setConfig(prev => ({
      ...prev,
      machines: prev.machines.filter((_, i) => i !== idx),
    }));
    setExpandedIdx(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: config as any, updated_at: new Date().toISOString() })
        .eq('key', 'plc_config');
      if (error) throw error;
      invalidatePLCCache();
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const checkConnection = useCallback(async (machine: PLCMachine) => {
    setStatuses(prev => ({ ...prev, [machine.machineId]: 'checking' }));
    try {
      const { data, error } = await supabase.functions.invoke('send-to-plc', {
        body: {
          orderNumber: 'PING',
          items: [],
          total: 0,
          payment: 'test',
          _ping: true,
          _targetMachine: machine.machineId,
        },
      });
      // If the edge function could reach the machine IP, it's connected
      const machineResult = data?.results?.find((r: any) => r.machineId === machine.machineId);
      const isConnected = machineResult?.success === true;
      setStatuses(prev => ({ ...prev, [machine.machineId]: isConnected ? 'connected' : 'disconnected' }));
      if (isConnected) {
        toast.success(lang === 'ku' ? `${machine.name} کۆنیکت بووە ✓` : lang === 'ar' ? `${machine.name} متصل ✓` : `${machine.name} connected ✓`);
      } else {
        toast.error(lang === 'ku' ? `${machine.name} کۆنیکت نەبوو` : lang === 'ar' ? `${machine.name} غير متصل` : `${machine.name} not reachable`);
      }
    } catch {
      setStatuses(prev => ({ ...prev, [machine.machineId]: 'disconnected' }));
      toast.error(lang === 'ku' ? `${machine.name} کۆنیکت نەبوو` : lang === 'ar' ? `${machine.name} غير متصل` : `${machine.name} not reachable`);
    }
  }, [lang]);

  const checkAllConnections = useCallback(() => {
    config.machines.forEach(m => checkConnection(m));
  }, [config.machines, checkConnection]);

  const handleTest = (machine: PLCMachine) => {
    checkConnection(machine);
  };

  const getStatusInfo = (machineId: string) => {
    const status = statuses[machineId] || 'unknown';
    switch (status) {
      case 'connected':
        return { color: 'text-success', bg: 'bg-success', label: lang === 'ku' ? 'کۆنیکت بووە' : lang === 'ar' ? 'متصل' : 'Connected', pulse: false };
      case 'disconnected':
        return { color: 'text-destructive', bg: 'bg-destructive', label: lang === 'ku' ? 'کۆنیکت نەبووە' : lang === 'ar' ? 'غير متصل' : 'Disconnected', pulse: false };
      case 'checking':
        return { color: 'text-warning', bg: 'bg-warning', label: lang === 'ku' ? 'پشکنین...' : lang === 'ar' ? 'فحص...' : 'Checking...', pulse: true };
      default:
        return { color: 'text-muted-foreground', bg: 'bg-muted-foreground', label: lang === 'ku' ? 'نەزانراو' : lang === 'ar' ? 'غير معروف' : 'Unknown', pulse: false };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const inputCls = "w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono";
  const labelCls = "text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold";

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-muted-foreground" />
        {t.plcSettings}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">{t.plcDesc}</p>

      {/* Modbus TCP Register Mapping */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-5">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-foreground font-bold text-sm">
            {lang === 'ku' ? 'نەخشەی ڕیجیستەرەکانی Modbus TCP' : lang === 'ar' ? 'خريطة سجلات Modbus TCP' : 'Modbus TCP Register Mapping'}
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-mono">S7-200 Smart</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-muted-foreground text-xs mb-3">
            {lang === 'ku' ? 'HoldStart = VB1000 · MaxHold = 200 · Port = 502' : 'HoldStart = VB1000 · MaxHold = 200 · Port = 502'}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 px-3 text-muted-foreground font-semibold">
                    {lang === 'ku' ? 'ڕیجیستەر' : 'Register'}
                  </th>
                  <th className="text-start py-2 px-3 text-muted-foreground font-semibold">V Memory</th>
                  <th className="text-start py-2 px-3 text-muted-foreground font-semibold">
                    {lang === 'ku' ? 'بەکارهاتن' : 'Usage'}
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  { reg: '40102', vm: 'VW1202', desc: lang === 'ku' ? 'فەرمانی سەرەکی (Command)' : 'Main Command' },
                  { reg: '40103', vm: 'VW1204', desc: lang === 'ku' ? 'فەرمانی لاوەکی (Sub-command)' : 'Sub-command' },
                  { reg: '40111', vm: 'VW1220', desc: lang === 'ku' ? 'کۆدی خواردنەوە/ئایتم (plc_code)' : 'Item/Drink Code (plc_code)' },
                  { reg: '40112', vm: 'VW1222', desc: lang === 'ku' ? 'بڕ / ژمارە' : 'Quantity' },
                  { reg: '40113', vm: 'VW1224', desc: lang === 'ku' ? 'پاڕامیتەر ١ (شەکر)' : 'Parameter 1 (Sugar)' },
                  { reg: '40114', vm: 'VW1226', desc: lang === 'ku' ? 'پاڕامیتەر ٢ (قەبارە)' : 'Parameter 2 (Size)' },
                  { reg: '40115', vm: 'VW1228', desc: lang === 'ku' ? 'پاڕامیتەر ٣' : 'Parameter 3' },
                  { reg: '40116', vm: 'VW1230', desc: lang === 'ku' ? 'پاڕامیتەر ٤' : 'Parameter 4' },
                  { reg: '40117', vm: 'VW1232', desc: lang === 'ku' ? 'پاڕامیتەر ٥' : 'Parameter 5' },
                  { reg: '40118', vm: 'VW1234', desc: lang === 'ku' ? 'پاڕامیتەر ٦' : 'Parameter 6' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-3 text-primary font-bold">{row.reg}</td>
                    <td className="py-2 px-3 text-foreground">{row.vm}</td>
                    <td className="py-2 px-3 text-muted-foreground font-sans">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-[11px] text-muted-foreground mt-3 space-y-1">
            <div className="text-primary font-bold">
              {lang === 'ku' ? 'چۆن کار دەکات:' : 'How it works:'}
            </div>
            <div>{lang === 'ku' ? '١. سیستەم plc_code ی ئایتمەکە دەنووسێت بۆ VW1220 (ڕیجیستەر 40111)' : '1. System writes item plc_code to VW1220 (register 40111)'}</div>
            <div>{lang === 'ku' ? '٢. بڕ/ژمارە دەنووسێت بۆ VW1222 (ڕیجیستەر 40112)' : '2. Quantity is written to VW1222 (register 40112)'}</div>
            <div>{lang === 'ku' ? '٣. فەرمانی ئامادەکردن (١) دەنووسێت بۆ VW1202 (ڕیجیستەر 40102)' : '3. Prepare command (1) is written to VW1202 (register 40102)'}</div>
            <div>{lang === 'ku' ? '٤. PLC فەرمانەکە دەخوێنێتەوە و دەستبەکار دەبێت' : '4. PLC reads the command and starts processing'}</div>
          </div>
          <div className="bg-secondary/50 border border-border rounded-lg p-3 text-[11px] text-muted-foreground mt-2 space-y-1">
            <div className="text-foreground font-bold">
              {lang === 'ku' ? 'ئامێرە کۆیلاینەکان (Modbus Client):' : 'Client Machines (Modbus Client):'}
            </div>
            <div>• 192.168.0.52:502 — {lang === 'ku' ? 'ڕیجیستەر 43201، ٢٠ ڕیجیستەر (VB200/VB250)' : 'Register 43201, 20 registers (VB200/VB250)'}</div>
            <div>• 192.168.0.53:502 — {lang === 'ku' ? 'ڕیجیستەر 43201، ٢٠ ڕیجیستەر (VB350/VB300)' : 'Register 43201, 20 registers (VB350/VB300)'}</div>
            <div className="mt-1 text-foreground font-bold">
              {lang === 'ku' ? 'RS485 (Modbus RTU):' : 'RS485 (Modbus RTU):'}
            </div>
            <div>• Slave 3, 4, 5 — {lang === 'ku' ? 'ناونیشان 40085، ٣ ڕیجیستەر' : 'Address 40085, 3 registers'}</div>
            <div>• Slave 20, 21 — {lang === 'ku' ? 'ناونیشان 40001، ١١ ڕیجیستەر' : 'Address 40001, 11 registers'}</div>
          </div>
        </div>
      </div>

      {/* PLC Item Codes */}
      <div className="mb-5">
        <PLCItemCodes lang={lang} />
      </div>

      {/* Check All Button */}
      <div className="mb-4">
        <button
          onClick={checkAllConnections}
          className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {lang === 'ku' ? 'پشکنینی هەموو ئامێرەکان' : lang === 'ar' ? 'فحص جميع الأجهزة' : 'Check All Machines'}
        </button>
      </div>

      {/* Machines List */}
      <div className="space-y-3 mb-5">
        {config.machines.map((machine, idx) => {
          const isExpanded = expandedIdx === idx;
          const statusInfo = getStatusInfo(machine.machineId);
          return (
            <div key={idx} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-start">
                  <div className="text-foreground font-bold text-sm">{machine.name}</div>
                  <div className="text-muted-foreground text-xs font-mono">{machine.machineId} · {machine.ip}:{machine.port}</div>
                </div>
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{
                    borderColor: statusInfo.color === 'text-success' ? 'hsl(var(--success) / 0.3)' :
                                 statusInfo.color === 'text-destructive' ? 'hsl(var(--destructive) / 0.3)' :
                                 statusInfo.color === 'text-warning' ? 'hsl(var(--warning, 45 93% 47%) / 0.3)' :
                                 'hsl(var(--border))',
                    backgroundColor: statusInfo.color === 'text-success' ? 'hsl(var(--success) / 0.08)' :
                                     statusInfo.color === 'text-destructive' ? 'hsl(var(--destructive) / 0.08)' :
                                     statusInfo.color === 'text-warning' ? 'hsl(var(--warning, 45 93% 47%) / 0.08)' :
                                     'transparent',
                  }}>
                    <span className={`relative flex h-2 w-2`}>
                      {statusInfo.pulse && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusInfo.bg}`}></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${statusInfo.bg}`}></span>
                    </span>
                    <span className={`text-[10px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                </div>
                <div className="text-muted-foreground text-xs">
                  {isExpanded ? '▲' : '▼'}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        {lang === 'ku' ? 'ناوی ئامێر' : lang === 'ar' ? 'اسم الجهاز' : 'Machine Name'}
                      </label>
                      <input className={inputCls} value={machine.name} onChange={e => updateMachine(idx, 'name', e.target.value)} placeholder="Robot 1" />
                    </div>
                    <div>
                      <label className={labelCls}>
                        {lang === 'ku' ? 'ناسنامەی ئامێر (Machine ID)' : lang === 'ar' ? 'معرف الجهاز' : 'Machine ID'}
                      </label>
                      <input className={inputCls} value={machine.machineId} onChange={e => updateMachine(idx, 'machineId', e.target.value)} placeholder="machine-01" />
                    </div>
                    <div>
                      <label className={labelCls}>{t.ipAddress}</label>
                      <input className={inputCls} value={machine.ip} onChange={e => updateMachine(idx, 'ip', e.target.value)} placeholder="192.168.1.100" />
                    </div>
                    <div>
                      <label className={labelCls}>{t.port}</label>
                      <input className={inputCls} value={machine.port} onChange={e => updateMachine(idx, 'port', e.target.value)} placeholder="502" />
                    </div>
                    <div>
                      <label className={labelCls}>{t.plcModel}</label>
                      <select className={inputCls} value={machine.model} onChange={e => {
                        updateMachine(idx, 'model', e.target.value);
                        // Auto-set protocol based on model
                        if (e.target.value === 'Siemens S7-200 Smart') {
                          updateMachine(idx, 'protocol', 'S7comm (Ethernet)');
                          updateMachine(idx, 'port', '102');
                        }
                      }}>
                        <option>Siemens S7-200 Smart</option>
                        <option>Siemens S7-1200</option>
                        <option>Siemens S7-1500</option>
                        <option>Allen Bradley</option>
                        <option>Mitsubishi FX</option>
                        <option>Omron CP1</option>
                        <option>Generic HTTP</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t.protocol}</label>
                      <select className={inputCls} value={machine.protocol} onChange={e => updateMachine(idx, 'protocol', e.target.value)}>
                        <option>S7comm (Ethernet)</option>
                        <option>Modbus TCP</option>
                        <option>Modbus RTU</option>
                        <option>OPC UA</option>
                        <option>Profinet</option>
                        <option>EtherNet/IP</option>
                        <option>HTTP REST</option>
                      </select>
                    </div>
                    {machine.model === 'Siemens S7-200 Smart' && (
                      <div className="col-span-2">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                          <div className="text-primary font-bold text-[11px] mb-1">Siemens S7-200 Smart</div>
                          <div>• <span className="text-foreground font-medium">S7comm (Ethernet)</span> — {lang === 'ku' ? 'پۆرت 102، پەیوەندی ڕاستەوخۆ بە CPU' : lang === 'ar' ? 'المنفذ 102، اتصال مباشر بالمعالج' : 'Port 102, direct CPU connection'}</div>
                          <div>• <span className="text-foreground font-medium">Modbus TCP</span> — {lang === 'ku' ? 'پۆرت 502، پشتگیری لە نۆدی Master/Slave' : lang === 'ar' ? 'المنفذ 502، دعم Master/Slave' : 'Port 502, Master/Slave support'}</div>
                          <div>• <span className="text-foreground font-medium">EtherNet/IP</span> — {lang === 'ku' ? 'پۆرت 44818، بۆ پەیوەندی CIP' : lang === 'ar' ? 'المنفذ 44818، لاتصال CIP' : 'Port 44818, for CIP communication'}</div>
                          <div>• <span className="text-foreground font-medium">HTTP REST</span> — {lang === 'ku' ? 'ئەگەر Smart بە وێبسێرڤەر بەکاربهێنیت' : lang === 'ar' ? 'إذا كان Smart يستخدم خادم ويب' : 'If Smart uses built-in web server'}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleTest(machine)}
                      className="flex-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {t.testConnection}
                    </button>
                    {config.machines.length > 1 && (
                      <button
                        onClick={() => removeMachine(idx)}
                        className="px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-destructive/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {lang === 'ku' ? 'سڕینەوە' : lang === 'ar' ? 'حذف' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Machine */}
      <button
        onClick={addMachine}
        className="w-full py-2.5 mb-5 border-2 border-dashed border-border rounded-xl text-muted-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:border-primary/30 hover:text-primary transition-all"
      >
        <Plus className="w-4 h-4" />
        {lang === 'ku' ? 'ئامێری نوێ زیاد بکە' : lang === 'ar' ? 'إضافة جهاز جديد' : 'Add New Machine'}
      </button>

      {/* Auto Send */}
      <div className="bg-card rounded-xl border border-border p-5 mb-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-foreground font-bold text-sm">{t.autoSend}</div>
          <div className="text-muted-foreground text-xs">{t.autoSendDesc}</div>
        </div>
        <button onClick={() => setConfig(p => ({ ...p, autoSend: !p.autoSend }))} className="transition-all">
          {config.autoSend
            ? <ToggleRight className="w-8 h-8 text-success" />
            : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
          }
        </button>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t.saveSettings}
      </button>
    </div>
  );
};

export default AdminPLC;
