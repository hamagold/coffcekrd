import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Trophy, Lightbulb, Droplets, HardHat, Package, FileText, Calendar, ArrowRight } from 'lucide-react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';

const AdminReports = ({ lang }: { lang: Language }) => {
  const { orders, expenses } = useStore();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const now = new Date();

  const getRange = (p: 'daily' | 'weekly' | 'monthly', offset = 0) => {
    if (p === 'daily') {
      const d = new Date(now);
      d.setDate(d.getDate() - offset);
      return { start: new Date(d.toDateString()), end: new Date(new Date(d.toDateString()).getTime() + 86400000) };
    } else if (p === 'weekly') {
      const end = new Date(now.getTime() - offset * 7 * 86400000);
      const start = new Date(end.getTime() - 7 * 86400000);
      return { start, end };
    } else {
      const m = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
      return { start: m, end: mEnd };
    }
  };

  const filterByRange = (range: { start: Date; end: Date }) => {
    const fo = orders.filter(o => { const d = new Date(o.time); return d >= range.start && d < range.end; });
    const fe = expenses.filter(e => { const d = new Date(e.date); return d >= range.start && d < range.end; });
    return { orders: fo, expenses: fe };
  };

  const current = filterByRange(getRange(period, 0));
  const previous = filterByRange(getRange(period, 1));

  const income = current.orders.reduce((s, o) => s + o.total, 0);
  const expenseTotal = current.expenses.reduce((s, e) => s + e.amount, 0);
  const profit = income - expenseTotal;

  const prevIncome = previous.orders.reduce((s, o) => s + o.total, 0);
  const prevExpense = previous.expenses.reduce((s, e) => s + e.amount, 0);
  const prevProfit = prevIncome - prevExpense;

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const incomeChange = pctChange(income, prevIncome);
  const expenseChange = pctChange(expenseTotal, prevExpense);
  const profitChange = pctChange(profit, prevProfit);

  const itemCounts: Record<string, { count: number; total: number }> = {};
  current.orders.forEach(o => o.items?.forEach(i => {
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

  // Expense by type for current and previous
  const expByType = (exps: typeof expenses, type: string) =>
    exps.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);

  const ChangeIndicator = ({ value }: { value: number }) => (
    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${value >= 0 ? 'text-success' : 'text-destructive'}`}>
      {value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value >= 0 ? '+' : ''}{value}%
    </span>
  );

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

      {/* Stats with comparison */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-success" /><span className="text-muted-foreground text-xs">{t.totalIncome}</span></div>
            <ChangeIndicator value={incomeChange} />
          </div>
          <div className="text-success text-xl font-bold">{income.toLocaleString()} IQD</div>
          <div className="text-muted-foreground text-[10px] mt-1">{t.previousPeriod}: {prevIncome.toLocaleString()} IQD</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-destructive" /><span className="text-muted-foreground text-xs">{t.totalExpenses}</span></div>
            <ChangeIndicator value={expenseChange} />
          </div>
          <div className="text-destructive text-xl font-bold">{expenseTotal.toLocaleString()} IQD</div>
          <div className="text-muted-foreground text-[10px] mt-1">{t.previousPeriod}: {prevExpense.toLocaleString()} IQD</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {profit >= 0 ? <TrendingUp className="w-4 h-4 text-primary" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              <span className="text-muted-foreground text-xs">{t.netProfitLoss}</span>
            </div>
            <ChangeIndicator value={profitChange} />
          </div>
          <div className={`text-xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>{profit.toLocaleString()} IQD</div>
          <div className="text-muted-foreground text-[10px] mt-1">{t.previousPeriod}: {prevProfit.toLocaleString()} IQD</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Income vs Expenses bar chart with comparison */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" /> {t.incomeVsExpenses}
          </div>
          <div className="p-5">
            <div className="h-[200px] flex items-end gap-2 px-2">
              {[
                { label: t.income, curr: income, prev: prevIncome, color: 'bg-success', prevColor: 'bg-success/30' },
                { label: t.expense, curr: expenseTotal, prev: prevExpense, color: 'bg-destructive', prevColor: 'bg-destructive/30' },
                { label: t.profit, curr: Math.abs(profit), prev: Math.abs(prevProfit), color: profit >= 0 ? 'bg-primary' : 'bg-destructive', prevColor: 'bg-primary/30' },
              ].map(b => {
                const max = Math.max(income, expenseTotal, prevIncome, prevExpense, 1);
                return (
                  <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-muted-foreground text-[9px] font-medium">{(b.curr / 1000).toFixed(1)}k</span>
                    <div className="w-full flex gap-1 items-end justify-center" style={{ height: '150px' }}>
                      <div className={`flex-1 rounded-t-md ${b.prevColor} transition-all`} style={{ height: `${Math.max(8, (b.prev / max) * 140)}px` }} title={t.previousPeriod} />
                      <div className={`flex-1 rounded-t-md ${b.color} transition-all`} style={{ height: `${Math.max(8, (b.curr / max) * 140)}px` }} title={t.currentPeriod} />
                    </div>
                    <span className="text-muted-foreground text-[10px]">{b.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-success/30 inline-block" /> {t.previousPeriod}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-success inline-block" /> {t.currentPeriod}</span>
            </div>
          </div>
        </div>

        {/* Top selling items */}
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
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>#{i + 1}</span>
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

      {/* Expense breakdown by type with comparison */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-5">
        <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" /> {t.expenseDetails} — {t.comparedToPrev}
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-3">
          {Object.entries(expenseTypeLabels).map(([type, info]) => {
            const Icon = info.icon;
            const curr = expByType(current.expenses, type);
            const prev = expByType(previous.expenses, type);
            const change = pctChange(curr, prev);
            const maxVal = Math.max(curr, prev, 1);
            return (
              <div key={type} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-foreground text-xs font-medium">{info.label}</span>
                    <ChangeIndicator value={change} />
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="bg-destructive/30 rounded-full transition-all" style={{ width: `${Math.max(4, (prev / maxVal) * 100)}%` }} />
                    <div className="bg-destructive rounded-full transition-all" style={{ width: `${Math.max(4, (curr / maxVal) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-muted-foreground text-[9px]">{prev.toLocaleString()}</span>
                    <span className="text-destructive text-[9px] font-medium">{curr.toLocaleString()} IQD</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense detail table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" /> {t.expenseDetails}
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
            {current.expenses.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-muted-foreground py-5 text-sm">{t.noExpenses}</td></tr>
            ) : (
              current.expenses.map(e => {
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
