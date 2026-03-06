import { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff, Save, Play, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';

interface PLCConfig {
  ip: string;
  port: string;
  model: string;
  protocol: string;
  autoSend: boolean;
}

const AdminPLC = ({ lang }: { lang: Language }) => {
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  const [config, setConfig] = useState<PLCConfig>(() => {
    try {
      const saved = localStorage.getItem('plc_plc_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ip: '192.168.1.100', port: '502', model: 'Siemens S7-1200', protocol: 'Modbus TCP', autoSend: false };
  });

  const [connected, setConnected] = useState(false);

  const handleSave = () => {
    localStorage.setItem('plc_plc_config', JSON.stringify(config));
    toast.success(t.saved);
  };

  const handleTest = () => {
    toast.info(lang === 'ku' ? 'تاقیکردنەوەی پەیوەندی...' : lang === 'ar' ? 'اختبار الاتصال...' : 'Testing connection...');
    setTimeout(() => {
      setConnected(true);
      toast.success(t.connected);
    }, 1500);
  };

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-muted-foreground" />
        {t.plcSettings}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">{t.plcDesc}</p>

      {/* Connection Status */}
      <div className={`bg-card rounded-xl border p-5 mb-5 flex items-center gap-4 ${connected ? 'border-success/30' : 'border-border'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connected ? 'bg-success/10' : 'bg-destructive/10'}`}>
          {connected ? <Wifi className="w-6 h-6 text-success" /> : <WifiOff className="w-6 h-6 text-destructive" />}
        </div>
        <div className="flex-1">
          <div className="text-foreground font-bold text-sm">{t.connectionStatus}</div>
          <div className={`text-xs font-semibold ${connected ? 'text-success' : 'text-destructive'}`}>
            ● {connected ? t.connected : t.disconnected}
          </div>
        </div>
        <button onClick={handleTest} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-primary/20 transition-all">
          <Play className="w-3.5 h-3.5" />
          {t.testConnection}
        </button>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-2 font-semibold">{t.ipAddress}</label>
          <input className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono" value={config.ip} onChange={e => setConfig(p => ({ ...p, ip: e.target.value }))} placeholder="192.168.1.100" />
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-2 font-semibold">{t.port}</label>
          <input className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono" value={config.port} onChange={e => setConfig(p => ({ ...p, port: e.target.value }))} placeholder="502" />
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-2 font-semibold">{t.plcModel}</label>
          <select className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-sm" value={config.model} onChange={e => setConfig(p => ({ ...p, model: e.target.value }))}>
            <option>Siemens S7-1200</option>
            <option>Siemens S7-1500</option>
            <option>Allen Bradley</option>
            <option>Mitsubishi FX</option>
            <option>Omron CP1</option>
          </select>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-2 font-semibold">{t.protocol}</label>
          <select className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-sm" value={config.protocol} onChange={e => setConfig(p => ({ ...p, protocol: e.target.value }))}>
            <option>Modbus TCP</option>
            <option>Modbus RTU</option>
            <option>OPC UA</option>
            <option>Profinet</option>
            <option>EtherNet/IP</option>
          </select>
        </div>
      </div>

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

      <button onClick={handleSave} className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2">
        <Save className="w-4 h-4" />
        {t.saveSettings}
      </button>
    </div>
  );
};

export default AdminPLC;
