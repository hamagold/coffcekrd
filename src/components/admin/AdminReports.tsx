import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Trophy, Lightbulb, Droplets, HardHat, Package, FileText } from 'lucide-react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';

const AdminReports = ({ lang }: { lang: Language }) => {
  const { orders, expenses } = useStore();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const now = new Date();
  let filteredOrders = orders;
  let filteredExp = expenses;

  if (period === 'daily') {
    filteredOrders = orders.filter(o => new Date(o.time).toDateString() === now.toDateString());
    filteredExp = expenses.filter(e => new Date(e.date).toDateString() === now.toDateString());
  } else if (period === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredOrders = orders.filter(o => new Date(o.time) >= weekAgo);
    filteredExp = expenses.filter(e => new Date(e.date) >= weekAgo);
  } else {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    filteredOrders = orders.filter(o => new Date(o.time) >= monthStart);
    filteredExp = expenses.filter(e => new Date(e.date) >= monthStart);
  }

  const income = filteredOrders.reduce((s, o) => s + o.total, 0);
  const expenseTotal = filteredExp.reduce((s, e) => s + e.amount, 0);
  const profit = income - expenseTotal;

  const itemCounts: Record<string, { count: number; total: number }> = {};
  filteredOrders.forEach(o => o.items?.forEach(i => {
    if (!itemCounts[i.name.en]) itemCounts[i.name.en] = { count: 0, total: 0 };
    itemCounts[i.name.en].count += i.qty;
    itemCounts[i.name.en].total += i.price * i.qty;
  }));
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  const maxBar = Math.max(income, expenseTotal, 1);

  const expenseTypeLabels: Record<string, { icon: typeof Lightbulb; label: string }> = {
    electricity: { icon: Lightbulb, label: t.electricity },
    water: { icon: Droplets, label: t.water },
    salary: { icon: HardHat, label: t.staffSalary },
    supplies: { icon: Package, label: t.supplies },
    other: { icon: FileText, label: t.other },
  };

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-base font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" /> {t.financialReports}
      </h2>
      <div className="flex gap-2 mb-5">
        {([{ key: 'daily', label: t.daily }, { key: 'weekly', label: t.weekly }, { key: 'monthly', label: t.monthly }] as const).map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key as any)} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${period === p.key ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-4 h-4 text-success" /><span className="text-muted-foreground text-xs">{t.totalIncome}</span></div>
          <div className="text-success text-xl font-bold">{income.toLocaleString()} IQD</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2"><ArrowDownRight className="w-4 h-4 text-destructive" /><span className="text-muted-foreground text-xs">{t.totalExpenses}</span></div>
          <div className="text-destructive text-xl font-bold">{expenseTotal.toLocaleString()} IQD</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            {profit >= 0 ? <TrendingUp className="w-4 h-4 text-primary" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
            <span className="text-muted-foreground text-xs">{t.netProfitLoss}</span>
          </div>
          <div className={`text-xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>{profit.toLocaleString()} IQD</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" /> {t.incomeVsExpenses}
          </div>
          <div className="p-5 h-[200px] flex items-end gap-3 px-4">
            {[
              { label: t.income, val: income, color: 'bg-success' },
              { label: t.expense, val: expenseTotal, color: 'bg-destructive' },
              { label: t.profit, val: Math.abs(profit), color: profit >= 0 ? 'bg-primary' : 'bg-destructive' },
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-muted-foreground text-[9px] font-medium">{(b.val / 1000).toFixed(1)}k</span>
                <div className={`w-full rounded-t-md ${b.color} transition-all`} style={{ height: `${Math.max(10, (b.val / maxBar) * 150)}px` }} />
                <span className="text-muted-foreground text-[10px]">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-muted-foreground" /> {t.topSellingItems}
          </div>
          <div className="p-4">
            {topItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-5 text-sm">{t.noData}</div>
            ) : (
              topItems.map(([name, data], i) => (
                <div key={name} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <span className="text-primary font-bold text-xs min-w-[20px]">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-foreground text-xs font-medium">{name}</div>
                    <div className="text-muted-foreground text-[10px]">{data.total.toLocaleString()} IQD</div>
                  </div>
                  <span className="text-primary font-bold text-xs">{data.count}×</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" /> {t.expenseDetails}
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {[t.date, t.type, t.description, t.amount].map(h => (
                <th key={h} className="bg-secondary text-muted-foreground text-[10px] tracking-widest uppercase p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredExp.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-muted-foreground py-5 text-sm">{t.noExpenses}</td></tr>
            ) : (
              filteredExp.map(e => {
                const typeInfo = expenseTypeLabels[e.type] || expenseTypeLabels.other;
                const TypeIcon = typeInfo.icon;
                return (
                  <tr key={e.id} className="border-b border-border">
                    <td className="p-3 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-3 text-foreground text-xs flex items-center gap-1.5"><TypeIcon className="w-3.5 h-3.5 text-muted-foreground" /> {typeInfo.label}</td>
                    <td className="p-3 text-foreground text-xs">{e.desc}</td>
                    <td className="p-3 text-destructive text-xs font-medium">{e.amount.toLocaleString()} IQD</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReports;
