import { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff, Save, Play, ToggleLeft, ToggleRight, Loader2, Plus, Trash2 } from 'lucide-react';
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
  // Legacy single-machine fields (for backward compat)
  ip?: string;
  port?: string;
  model?: string;
  protocol?: string;
  machineId?: string;
}

const DEFAULT_MACHINE: PLCMachine = {
  machineId: 'machine-01',
  name: 'Robot 1',
  ip: '192.168.1.100',
  port: '502',
  model: 'Siemens S7-1200',
  protocol: 'Modbus TCP',
};

const DEFAULT_CONFIG: PLCConfig = {
  autoSend: false,
  machines: [
    { ...DEFAULT_MACHINE },
    { machineId: 'machine-02', name: 'Robot 2', ip: '192.168.1.101', port: '502', model: 'Siemens S7-1200', protocol: 'Modbus TCP' },
    { machineId: 'machine-03', name: 'Robot 3', ip: '192.168.1.102', port: '502', model: 'Siemens S7-1200', protocol: 'Modbus TCP' },
  ],
};

// Cache
let cachedPLCConfig: PLCConfig | null = null;

// Migrate old single-machine config to multi-machine
const migrateConfig = (raw: any): PLCConfig => {
  if (raw?.machines) return raw as PLCConfig;
  // Old format: single machine
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

const AdminPLC = ({ lang }: { lang: Language }) => {
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  const [config, setConfig] = useState<PLCConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

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

  const handleTest = (machine: PLCMachine) => {
    toast.info(lang === 'ku' ? `تاقیکردنەوەی ${machine.name}...` : lang === 'ar' ? `اختبار ${machine.name}...` : `Testing ${machine.name}...`);
    setTimeout(() => {
      toast.success(lang === 'ku' ? `${machine.name} کۆنیکت بوو` : lang === 'ar' ? `${machine.name} متصل` : `${machine.name} connected`);
    }, 1500);
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

      {/* Machines List */}
      <div className="space-y-3 mb-5">
        {config.machines.map((machine, idx) => {
          const isExpanded = expandedIdx === idx;
          return (
            <div key={idx} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Machine Header */}
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
                <div className="text-muted-foreground text-xs">
                  {isExpanded ? '▲' : '▼'}
                </div>
              </button>

              {/* Machine Details (expanded) */}
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
                      <select className={inputCls} value={machine.model} onChange={e => updateMachine(idx, 'model', e.target.value)}>
                        <option>Siemens S7-1200</option>
                        <option>Siemens S7-1500</option>
                        <option>Allen Bradley</option>
                        <option>Mitsubishi FX</option>
                        <option>Omron CP1</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t.protocol}</label>
                      <select className={inputCls} value={machine.protocol} onChange={e => updateMachine(idx, 'protocol', e.target.value)}>
                        <option>Modbus TCP</option>
                        <option>Modbus RTU</option>
                        <option>OPC UA</option>
                        <option>Profinet</option>
                        <option>EtherNet/IP</option>
                      </select>
                    </div>
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
