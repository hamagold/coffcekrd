import { useState, useEffect } from 'react';
import { FileText, RefreshCw, CheckCircle, XCircle, Loader2, Trash2, Clock } from 'lucide-react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { supabase } from '@/integrations/supabase/client';

interface PLCLogEntry {
  orderNumber: string;
  itemCount: number;
  total: number;
  plcIp: string;
  plcPort: string;
  success: boolean;
  error: string | null;
  response: string | null;
  timestamp: string;
}

const AdminPLCLogs = ({ lang }: { lang: Language }) => {
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [logs, setLogs] = useState<PLCLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'plc_logs')
      .maybeSingle();
    setLogs((data?.value as any)?.logs || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const clearLogs = async () => {
    await supabase
      .from('app_settings')
      .update({ value: { logs: [] } as any, updated_at: new Date().toISOString() })
      .eq('key', 'plc_logs');
    setLogs([]);
  };

  const successCount = logs.filter(l => l.success).length;
  const failCount = logs.filter(l => !l.success).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-muted-foreground" />
        {t.plcLogs}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">{t.plcLogsDesc}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="text-2xl font-black text-foreground">{logs.length}</div>
          <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{t.plcLogsTotal}</div>
        </div>
        <div className="bg-card rounded-xl border border-success/20 p-4 text-center">
          <div className="text-2xl font-black text-success">{successCount}</div>
          <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{t.plcLogsSuccess}</div>
        </div>
        <div className="bg-card rounded-xl border border-destructive/20 p-4 text-center">
          <div className="text-2xl font-black text-destructive">{failCount}</div>
          <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{t.plcLogsFailed}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-5">
        <button onClick={fetchLogs} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-primary/20 transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          {t.plcLogsRefresh}
        </button>
        {logs.length > 0 && (
          <button onClick={clearLogs} className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-destructive/20 transition-all cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
            {t.plcLogsClear}
          </button>
        )}
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <div className="text-muted-foreground text-sm">{t.plcLogsEmpty}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className={`bg-card rounded-xl border p-4 transition-all ${log.success ? 'border-success/20' : 'border-destructive/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {log.success ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-foreground font-bold text-sm">
                    {t.plcLogsOrder} #{log.orderNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${log.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {log.success ? t.plcLogsSuccess : t.plcLogsFailed}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t.plcLogsItems}: </span>
                  <span className="text-foreground font-semibold">{log.itemCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.plcLogsTotal}: </span>
                  <span className="text-foreground font-semibold">{log.total?.toLocaleString()} IQD</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP: </span>
                  <span className="text-foreground font-mono text-[11px]">{log.plcIp}:{log.plcPort}</span>
                </div>
                {log.error && (
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-destructive text-[11px]">{log.error}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPLCLogs;
