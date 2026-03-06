import { useStore } from '@/store/StoreContext';
import { DollarSign, ClipboardList, Bot, ChefHat, Banknote, CreditCard, Smartphone, Zap, Lightbulb, Droplets, HardHat, TrendingUp, TrendingDown } from 'lucide-react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';

const AdminDashboard = ({ lang }: { lang: Language }) => {
  const { orders, expenses } = useStore();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.time).toDateString() === today);
  const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const robotOrders = todayOrders.filter(o => o.items?.some(i => i.id.startsWith('r')));
  const staffOrders = todayOrders.filter(o => o.items?.some(i => i.id.startsWith('s')));

  const todayExp = expenses.filter(e => new Date(e.date).toDateString() === today);
  const totalExp = todayExp.reduce((s, e) => s + e.amount, 0);

  const paymentBreakdown = (method: string) =>
    todayOrders.filter(o => o.payment === method).reduce((s, o) => s + o.total, 0);
  const expByType = (type: string) =>
    todayExp.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);

  const stats = [
    { icon: DollarSign, value: `${revenue.toLocaleString()} IQD`, label: t.todayRevenue, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: ClipboardList, value: todayOrders.length, label: t.totalOrdersToday, color: 'text-success', bg: 'bg-success/10' },
    { icon: Bot, value: robotOrders.length, label: t.robotOrders, color: 'text-info', bg: 'bg-info/10' },
    { icon: ChefHat, value: staffOrders.length, label: t.staffOrders, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  return (
    <div dir={dir}>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card rounded-xl p-5 border border-border">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-bold mb-0.5 ${s.color}`}>{s.value}</div>
              <div className="text-muted-foreground text-xs">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-semibold text-sm">{t.recentOrders}</span>
          </div>
          <div className="p-4">
            {todayOrders.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">{t.noOrdersYet}</div>
            ) : (
              todayOrders.slice(-8).reverse().map(o => (
                <div key={o.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
                  <span className="bg-secondary border border-primary/20 px-2.5 py-1 rounded-md text-primary text-xs font-bold min-w-[52px] text-center">#{o.id}</span>
                  <div className="flex-1">
                    <div className="text-foreground text-xs font-medium">{o.items?.length} {t.items}</div>
                    <div className="text-muted-foreground text-[11px]">{new Date(o.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {o.payment} · {o.type}</div>
                  </div>
                  <div className="text-primary text-xs font-bold">{o.total.toLocaleString()} IQD</div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">{t.done}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-semibold text-sm">{t.todaySummary}</span>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-2 font-semibold">{t.paymentBreakdown}</div>
              {[
                { icon: Banknote, label: t.cash, method: 'cash' },
                { icon: CreditCard, label: t.fibBank, method: 'fib' },
                { icon: Smartphone, label: t.zainCash, method: 'zain' },
                { icon: Zap, label: t.fastPay, method: 'fastpay' },
              ].map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.method} className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {p.label}</span>
                    <span className="text-primary text-xs font-medium">{paymentBreakdown(p.method).toLocaleString()} IQD</span>
                  </div>
                );
              })}
            </div>
            <div className="mb-4">
              <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-2 font-semibold">{t.expensesToday}</div>
              {[
                { icon: Lightbulb, label: t.electricity, type: 'electricity' },
                { icon: Droplets, label: t.water, type: 'water' },
                { icon: HardHat, label: t.salaries, type: 'salary' },
              ].map(e => {
                const Icon = e.icon;
                return (
                  <div key={e.type} className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {e.label}</span>
                    <span className="text-destructive text-xs font-medium">{expByType(e.type).toLocaleString()} IQD</span>
                  </div>
                );
              })}
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t.netProfit}</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${revenue - totalExp >= 0 ? 'text-success' : 'text-destructive'}`}>
                {revenue - totalExp >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {(revenue - totalExp).toLocaleString()} IQD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
