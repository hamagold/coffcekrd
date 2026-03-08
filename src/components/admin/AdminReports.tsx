import { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Trophy, Lightbulb, Droplets, HardHat, Package, FileText, Calendar, ChevronLeft, ChevronRight, ShoppingCart, PieChart, LayoutDashboard, Receipt, TrendingUpIcon } from 'lucide-react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const MONTH_NAMES = {
  ku: ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const AdminReports = ({ lang }: { lang: Language }) => {
  const { orders, expenses } = useStore();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [offset, setOffset] = useState(0);

  const now = new Date();

  const getRange = (p: typeof period, off: number) => {
    if (p === 'daily') {
      const d = new Date(now);
      d.setDate(d.getDate() - off);
      return { start: new Date(d.toDateString()), end: new Date(new Date(d.toDateString()).getTime() + 86400000) };
    } else if (p === 'weekly') {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek - off * 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return { start: startOfWeek, end: endOfWeek };
    } else {
      const m = new Date(now.getFullYear(), now.getMonth() - off, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - off + 1, 1);
      return { start: m, end: mEnd };
    }
  };

  const currentRange = getRange(period, offset);
  const previousRange = getRange(period, offset + 1);

  const filterByRange = (range: { start: Date; end: Date }) => {
    const fo = orders.filter(o => { const d = new Date(o.time); return d >= range.start && d < range.end; });
    const fe = expenses.filter(e => { const d = new Date(e.date); return d >= range.start && d < range.end; });
    return { orders: fo, expenses: fe };
  };

  const current = filterByRange(currentRange);
  const previous = filterByRange(previousRange);

  const income = current.orders.reduce((s, o) => s + o.total, 0);
  const expenseTotal = current.expenses.reduce((s, e) => s + e.amount, 0);
  const profit = income - expenseTotal;
  const orderCount = current.orders.length;

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
    const name = i.name[lang] || i.name.en;
    if (!itemCounts[name]) itemCounts[name] = { count: 0, total: 0 };
    itemCounts[name].count += i.qty;
    itemCounts[name].total += i.price * i.qty;
  }));
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  const expenseTypeLabels: Record<string, { icon: typeof Lightbulb; label: string }> = {
    electricity: { icon: Lightbulb, label: t.electricity },
    water: { icon: Droplets, label: t.water },
    salary: { icon: HardHat, label: t.staffSalary },
    supplies: { icon: Package, label: t.supplies },
    other: { icon: FileText, label: t.other },
  };

  const expByType = (exps: typeof expenses, type: string) =>
    exps.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);

  // Daily trend data for line chart
  const trendData = useMemo(() => {
    const days: { date: string; income: number; expenses: number; profit: number }[] = [];
    const rangeMs = currentRange.end.getTime() - currentRange.start.getTime();
    const numDays = Math.max(1, Math.round(rangeMs / 86400000));
    
    for (let i = 0; i < numDays; i++) {
      const dayStart = new Date(currentRange.start.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayOrders = orders.filter(o => { const d = new Date(o.time); return d >= dayStart && d < dayEnd; });
      const dayExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= dayStart && d < dayEnd; });
      const dayIncome = dayOrders.reduce((s, o) => s + o.total, 0);
      const dayExp = dayExpenses.reduce((s, e) => s + e.amount, 0);
      days.push({
        date: dayStart.toLocaleDateString(lang === 'ku' ? 'ckb' : lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric' }),
        income: dayIncome,
        expenses: dayExp,
        profit: dayIncome - dayExp,
      });
    }
    return days;
  }, [orders, expenses, currentRange.start.getTime(), currentRange.end.getTime(), lang]);

  const dateLabel = useMemo(() => {
    if (period === 'daily') {
      return currentRange.start.toLocaleDateString(lang === 'ku' ? 'ckb' : lang === 'ar' ? 'ar' : 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (period === 'weekly') {
      const startStr = currentRange.start.toLocaleDateString(lang === 'ku' ? 'ckb' : lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric' });
      const endDate = new Date(currentRange.end.getTime() - 86400000);
      const endStr = endDate.toLocaleDateString(lang === 'ku' ? 'ckb' : lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric' });
      return `${startStr} — ${endStr}`;
    } else {
      return `${MONTH_NAMES[lang][currentRange.start.getMonth()]} ${currentRange.start.getFullYear()}`;
    }
  }, [period, offset, lang]);

  const canGoForward = offset > 0;

  const ChangeIndicator = ({ value }: { value: number }) => (
    <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${value >= 0 ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
      {value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value >= 0 ? '+' : ''}{value}%
    </span>
  );

  const tabLabels = {
    summary: { ku: 'پوختە', ar: 'ملخص', en: 'Summary' },
    charts: { ku: 'چارتەکان', ar: 'الرسوم البيانية', en: 'Charts' },
    expenses: { ku: 'خەرجییەکان', ar: 'المصاريف', en: 'Expenses' },
  };

  return (
    <div dir={dir} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          {t.financialReports}
        </h2>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {([{ key: 'daily', label: t.daily }, { key: 'weekly', label: t.weekly }, { key: 'monthly', label: t.monthly }] as const).map(p => (
          <button key={p.key} onClick={() => { setPeriod(p.key as any); setOffset(0); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${period === p.key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
        <button onClick={() => setOffset(o => o + 1)}
          className="w-8 h-8 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center transition-colors">
          {dir === 'rtl' ? <ChevronRight className="w-4 h-4 text-foreground" /> : <ChevronLeft className="w-4 h-4 text-foreground" />}
        </button>
        <div className="text-center">
          <div className="text-foreground font-bold text-sm">{dateLabel}</div>
          {offset > 0 && (
            <button onClick={() => setOffset(0)} className="text-primary text-[10px] font-medium hover:underline mt-0.5">
              {lang === 'ku' ? 'گەڕانەوە بۆ ئەمڕۆ' : lang === 'ar' ? 'العودة لليوم' : 'Back to today'}
            </button>
          )}
        </div>
        <button onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={!canGoForward}
          className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center transition-colors ${canGoForward ? 'bg-secondary hover:bg-accent' : 'bg-muted opacity-40 cursor-not-allowed'}`}>
          {dir === 'rtl' ? <ChevronLeft className="w-4 h-4 text-foreground" /> : <ChevronRight className="w-4 h-4 text-foreground" />}
        </button>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-11 mb-4">
          <TabsTrigger value="summary" className="text-xs font-semibold gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            {tabLabels.summary[lang]}
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-xs font-semibold gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            {tabLabels.charts[lang]}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs font-semibold gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            {tabLabels.expenses[lang]}
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: Summary ===== */}
        <TabsContent value="summary" className="space-y-4 mt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t.totalIncome, value: income, prev: prevIncome, change: incomeChange, icon: ArrowUpRight, color: 'text-success', iconBg: 'bg-success/10' },
              { label: t.totalExpenses, value: expenseTotal, prev: prevExpense, change: expenseChange, icon: ArrowDownRight, color: 'text-destructive', iconBg: 'bg-destructive/10' },
              { label: t.netProfitLoss, value: profit, prev: prevProfit, change: profitChange, icon: profit >= 0 ? TrendingUp : TrendingDown, color: profit >= 0 ? 'text-primary' : 'text-destructive', iconBg: profit >= 0 ? 'bg-primary/10' : 'bg-destructive/10' },
              { label: t.orderCount, value: orderCount, prev: previous.orders.length, change: pctChange(orderCount, previous.orders.length), icon: ShoppingCart, color: 'text-primary', iconBg: 'bg-primary/10', isCurrency: false },
            ].map((stat, i) => {
              const Icon = stat.icon;
              const isCurrency = stat.isCurrency !== false;
              return (
                <div key={i} className="bg-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <ChangeIndicator value={stat.change} />
                  </div>
                  <div className={`${stat.color} text-xl font-bold mb-0.5`}>
                    {stat.value.toLocaleString()}{isCurrency ? ' IQD' : ''}
                  </div>
                  <div className="text-muted-foreground text-[10px]">{stat.label}</div>
                  <div className="text-muted-foreground text-[9px] mt-1 opacity-70">
                    {t.previousPeriod}: {stat.prev.toLocaleString()}{isCurrency ? ' IQD' : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Selling Items */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-warning" />
              </div>
              <span className="text-foreground font-semibold text-sm">{t.topSellingItems}</span>
            </div>
            <div className="p-4">
              {topItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">{t.noData}</div>
              ) : (
                topItems.map(([name, data], i) => {
                  const maxCount = topItems[0]?.[1]?.count || 1;
                  return (
                    <div key={name} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-primary text-primary-foreground' : i === 1 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-foreground text-xs font-medium truncate">{name}</span>
                          <span className="text-primary font-bold text-xs shrink-0 ms-2">{data.count}×</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div className="bg-primary/60 rounded-full h-1.5 transition-all duration-500" style={{ width: `${(data.count / maxCount) * 100}%` }} />
                        </div>
                        <div className="text-muted-foreground text-[10px] mt-0.5">{data.total.toLocaleString()} IQD</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== TAB 2: Charts ===== */}
        <TabsContent value="charts" className="space-y-4 mt-0">
          {/* Income vs Expenses */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-foreground font-semibold text-sm">{t.incomeVsExpenses}</span>
            </div>
            <div className="p-5">
              <div className="h-[220px] flex items-end gap-4 px-6">
                {[
                  { label: t.income, curr: income, prev: prevIncome, color: 'bg-success', prevColor: 'bg-success/20' },
                  { label: t.expense, curr: expenseTotal, prev: prevExpense, color: 'bg-destructive', prevColor: 'bg-destructive/20' },
                  { label: t.profit, curr: Math.abs(profit), prev: Math.abs(prevProfit), color: profit >= 0 ? 'bg-primary' : 'bg-destructive', prevColor: 'bg-primary/20' },
                ].map(b => {
                  const max = Math.max(income, expenseTotal, prevIncome, prevExpense, 1);
                  return (
                    <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-foreground text-[11px] font-bold">{(b.curr / 1000).toFixed(1)}k</span>
                      <div className="w-full flex gap-2 items-end justify-center" style={{ height: '160px' }}>
                        <div className={`flex-1 rounded-t-lg ${b.prevColor} transition-all duration-500`} style={{ height: `${Math.max(12, (b.prev / max) * 150)}px` }} />
                        <div className={`flex-1 rounded-t-lg ${b.color} transition-all duration-500 shadow-sm`} style={{ height: `${Math.max(12, (b.curr / max) * 150)}px` }} />
                      </div>
                      <span className="text-muted-foreground text-[11px] font-medium">{b.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-success/20 inline-block" /> {t.previousPeriod}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-success inline-block" /> {t.currentPeriod}</span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown by Type */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center">
                  <PieChart className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-foreground font-semibold text-sm">{t.expenseDetails}</span>
              </div>
              <span className="text-muted-foreground text-[10px]">{t.comparedToPrev}</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(expenseTypeLabels).map(([type, info]) => {
                const Icon = info.icon;
                const curr = expByType(current.expenses, type);
                const prev = expByType(previous.expenses, type);
                const change = pctChange(curr, prev);
                const maxVal = Math.max(curr, prev, 1);
                return (
                  <div key={type} className="bg-secondary/40 rounded-xl p-3.5 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-destructive" />
                        </div>
                        <span className="text-foreground text-xs font-semibold">{info.label}</span>
                      </div>
                      <ChangeIndicator value={change} />
                    </div>
                    <div className="flex gap-1.5 h-2 rounded-full overflow-hidden bg-background mb-1.5">
                      <div className="bg-destructive/25 rounded-full transition-all duration-500" style={{ width: `${Math.max(4, (prev / maxVal) * 100)}%` }} />
                      <div className="bg-destructive rounded-full transition-all duration-500" style={{ width: `${Math.max(4, (curr / maxVal) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-[9px]">{t.previousPeriod}: {prev.toLocaleString()}</span>
                      <span className="text-destructive text-[9px] font-bold">{curr.toLocaleString()} IQD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ===== TAB 3: Expenses ===== */}
        <TabsContent value="expenses" className="mt-0">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-foreground font-semibold text-sm">{t.expenseDetails}</span>
              <span className="text-muted-foreground text-[10px] ms-auto">{current.expenses.length} {lang === 'ku' ? 'تۆمار' : lang === 'ar' ? 'سجل' : 'records'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[t.date, t.type, t.description, t.amount].map(h => (
                      <th key={h} className="bg-secondary/60 text-muted-foreground text-[10px] tracking-widest uppercase p-3 text-start font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {current.expenses.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-muted-foreground py-10 text-sm">{t.noExpenses}</td></tr>
                  ) : (
                    current.expenses.map(e => {
                      const typeInfo = expenseTypeLabels[e.type] || expenseTypeLabels.other;
                      const TypeIcon = typeInfo.icon;
                      return (
                        <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="p-3 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="p-3 text-foreground text-xs">
                            <span className="flex items-center gap-1.5">
                              <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" /> {typeInfo.label}
                            </span>
                          </td>
                          <td className="p-3 text-foreground text-xs">{e.desc}</td>
                          <td className="p-3 text-destructive text-xs font-bold">{e.amount.toLocaleString()} IQD</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
