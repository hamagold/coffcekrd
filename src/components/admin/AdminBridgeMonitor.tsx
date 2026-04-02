import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Wifi, WifiOff, Clock, CheckCircle2, Loader2, AlertTriangle, RefreshCw, Cpu, Zap } from 'lucide-react';
import { Language } from '@/types';

interface OrderStatusCounts {
  pending: number;
  preparing: number;
  done: number;
  error: number;
  pending_payment: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  payment: string;
}

const AdminBridgeMonitor = ({ lang }: { lang: Language }) => {
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [counts, setCounts] = useState<OrderStatusCounts>({ pending: 0, preparing: 0, done: 0, error: 0, pending_payment: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [bridgeActive, setBridgeActive] = useState<boolean | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch counts
    const { data: allOrders } = await supabase.from('orders').select('status');
    if (allOrders) {
      const c: OrderStatusCounts = { pending: 0, preparing: 0, done: 0, error: 0, pending_payment: 0 };
      allOrders.forEach((o: any) => {
        if (o.status in c) c[o.status as keyof OrderStatusCounts]++;
      });
      setCounts(c);
    }

    // Fetch recent 15 orders
    const { data: recent } = await supabase.from('orders').select('id, order_number, status, created_at, total, payment').order('created_at', { ascending: false }).limit(15);
    if (recent) setRecentOrders(recent as RecentOrder[]);

    // Check if bridge is active by looking if any order moved from pending→preparing recently
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentPrep } = await supabase.from('orders').select('id').in('status', ['preparing', 'done']).gte('created_at', fiveMinAgo).limit(1);
    // If there are pending orders but none moved recently, bridge might be down
    const hasPending = (allOrders || []).some((o: any) => o.status === 'pending');
    const hasRecentActivity = (recentPrep && recentPrep.length > 0);
    if (hasPending && !hasRecentActivity) setBridgeActive(false);
    else if (hasRecentActivity) setBridgeActive(true);
    else setBridgeActive(null); // unknown

    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('bridge-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchData(); })
      .subscribe();
    // Auto refresh every 10s
    const interval = setInterval(fetchData, 10000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [fetchData]);

  const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
    pending: {
      color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
      icon: <Clock className="w-4 h-4" />,
      label: lang === 'ku' ? 'چاوەڕوان' : lang === 'ar' ? 'قيد الانتظار' : 'Pending',
    },
    preparing: {
      color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      label: lang === 'ku' ? 'ئامادەکردن' : lang === 'ar' ? 'جاري التحضير' : 'Preparing',
    },
    done: {
      color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200',
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: lang === 'ku' ? 'تەواو' : lang === 'ar' ? 'مكتمل' : 'Done',
    },
    error: {
      color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: lang === 'ku' ? 'هەڵە' : lang === 'ar' ? 'خطأ' : 'Error',
    },
  };

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <Activity className="w-5 h-5 text-muted-foreground" />
        {lang === 'ku' ? 'مۆنیتۆری Bridge' : lang === 'ar' ? 'مراقب Bridge' : 'Bridge Monitor'}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {lang === 'ku' ? 'سەیری دۆخی bridge.js و ئۆردەرەکان بکە بە ڕیئەڵتایم' : lang === 'ar' ? 'راقب حالة bridge.js والطلبات بشكل مباشر' : 'Monitor bridge.js status and orders in realtime'}
      </p>

      {/* Bridge Status Card */}
      <div className={`rounded-xl border-2 p-5 mb-5 flex items-center gap-4 ${
        bridgeActive === true ? 'border-green-300 bg-green-50/50' :
        bridgeActive === false ? 'border-red-300 bg-red-50/50' :
        'border-border bg-card'
      }`}>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          bridgeActive === true ? 'bg-green-100' :
          bridgeActive === false ? 'bg-red-100' :
          'bg-secondary'
        }`}>
          {bridgeActive === true ? <Wifi className="w-7 h-7 text-green-600" /> :
           bridgeActive === false ? <WifiOff className="w-7 h-7 text-red-600" /> :
           <Cpu className="w-7 h-7 text-muted-foreground" />}
        </div>
        <div className="flex-1">
          <div className={`text-lg font-bold ${
            bridgeActive === true ? 'text-green-700' :
            bridgeActive === false ? 'text-red-700' :
            'text-foreground'
          }`}>
            {bridgeActive === true ? (lang === 'ku' ? '✅ Bridge کاردەکات' : lang === 'ar' ? '✅ Bridge يعمل' : '✅ Bridge Active') :
             bridgeActive === false ? (lang === 'ku' ? '🔴 Bridge کارناکات — ئۆردەرە چاوەڕوانەکان پڕۆسێس نابن' : lang === 'ar' ? '🔴 Bridge متوقف — الطلبات لا تتم معالجتها' : '🔴 Bridge Inactive — Pending orders not being processed') :
             (lang === 'ku' ? '⚪ دۆخی Bridge نەزانراوە' : lang === 'ar' ? '⚪ حالة Bridge غير معروفة' : '⚪ Bridge Status Unknown')}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span>{lang === 'ku' ? 'دوایین نوێکردنەوە:' : lang === 'ar' ? 'آخر تحديث:' : 'Last update:'} {lastUpdate.toLocaleTimeString('en-GB')}</span>
            {bridgeActive === false && counts.pending > 0 && (
              <span className="text-red-600 font-bold animate-pulse">
                ⚠ {counts.pending} {lang === 'ku' ? 'ئۆردەری چاوەڕوان' : 'pending'}
              </span>
            )}
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} className="px-3 py-2 bg-secondary border border-border rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary/80 transition-all disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {lang === 'ku' ? 'نوێکردنەوە' : lang === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Status Count Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(['pending', 'preparing', 'done', 'error'] as const).map(status => {
          const cfg = statusConfig[status];
          const count = counts[status];
          return (
            <div key={status} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 text-center`}>
              <div className={`flex items-center justify-center gap-1.5 ${cfg.color} mb-2`}>
                {cfg.icon}
                <span className="text-xs font-bold uppercase tracking-wider">{cfg.label}</span>
              </div>
              <div className={`text-3xl font-black ${cfg.color}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <div className="text-foreground font-bold text-sm mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          {lang === 'ku' ? 'چۆن کاردەکات:' : lang === 'ar' ? 'كيف يعمل:' : 'How it works:'}
        </div>
        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
            <span>{lang === 'ku' ? 'کڕیار ئۆردەر دادەنێت → ستاتەس: Pending (چاوەڕوان)' : 'Customer places order → Status: Pending'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
            <span>{lang === 'ku' ? 'bridge.js ئۆردەرەکە دەدۆزێتەوە → ستاتەس: Preparing (ئامادەکردن) و دەینێرێت بۆ PLC' : 'bridge.js picks it up → Status: Preparing & sends to PLC'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
            <span>{lang === 'ku' ? 'PLC فەرمانەکە جێبەجێ دەکات → ستاتەس: Done (تەواو)' : 'PLC executes the command → Status: Done'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
            <span>{lang === 'ku' ? 'ئەگەر کۆنیکت نەبوو → ستاتەس: Error (هەڵە)' : 'If connection fails → Status: Error'}</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Live Feed */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-foreground font-bold text-sm">
              {lang === 'ku' ? 'دوایین ئۆردەرەکان (ڕیئەڵتایم)' : lang === 'ar' ? 'أحدث الطلبات (مباشر)' : 'Recent Orders (Live)'}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {recentOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">
              {loading ? (lang === 'ku' ? 'بارکردن...' : 'Loading...') : (lang === 'ku' ? 'هیچ ئۆردەرێک نییە' : 'No orders yet')}
            </div>
          ) : (
            recentOrders.map(order => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              const time = new Date(order.created_at);
              const ago = Math.floor((Date.now() - time.getTime()) / 1000);
              const agoText = ago < 60 ? `${ago}s` : ago < 3600 ? `${Math.floor(ago / 60)}m` : `${Math.floor(ago / 3600)}h`;
              return (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                  {/* Status dot */}
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-bold text-sm">#{order.order_number}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">
                      {order.total.toLocaleString()} IQD · {order.payment.toUpperCase()}
                    </div>
                  </div>
                  {/* Time ago */}
                  <div className="text-muted-foreground text-xs font-mono shrink-0">{agoText}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBridgeMonitor;
