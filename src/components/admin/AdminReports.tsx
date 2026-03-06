import { useState } from 'react';
import { useStore } from '@/store/StoreContext';

const AdminReports = () => {
  const { orders, expenses } = useStore();
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

  // Top items
  const itemCounts: Record<string, { count: number; total: number; emoji: string }> = {};
  filteredOrders.forEach(o => o.items?.forEach(i => {
    if (!itemCounts[i.name.en]) itemCounts[i.name.en] = { count: 0, total: 0, emoji: i.emoji };
    itemCounts[i.name.en].count += i.qty;
    itemCounts[i.name.en].total += i.price * i.qty;
  }));
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  const maxBar = Math.max(income, expenseTotal, 1);

  return (
    <div>
      <h2 className="text-foreground text-lg font-bold mb-4">📈 Financial Reports</h2>
      <div className="flex gap-2 mb-5">
        {(['daily', 'weekly', 'monthly'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-5 py-2 rounded-lg text-sm font-bold border-2 ${period === p ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary border-transparent text-foreground/50'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-muted rounded-xl p-4 border border-foreground/5">
          <div className="text-foreground/40 text-xs mb-1.5">💰 Total Income</div>
          <div className="text-success text-2xl font-black">{income.toLocaleString()} IQD</div>
        </div>
        <div className="bg-muted rounded-xl p-4 border border-foreground/5">
          <div className="text-foreground/40 text-xs mb-1.5">📤 Total Expenses</div>
          <div className="text-destructive text-2xl font-black">{expenseTotal.toLocaleString()} IQD</div>
        </div>
        <div className="bg-muted rounded-xl p-4 border border-foreground/5">
          <div className="text-foreground/40 text-xs mb-1.5">📊 Net Profit / Loss</div>
          <div className={`text-2xl font-black ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>{profit.toLocaleString()} IQD</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Chart */}
        <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-foreground/5 text-foreground font-bold">📈 Income vs Expenses</div>
          <div className="p-5 h-[200px] flex items-end gap-2 px-2">
            {[
              { label: 'Income', val: income, color: 'bg-success' },
              { label: 'Expense', val: expenseTotal, color: 'bg-destructive' },
              { label: 'Profit', val: Math.abs(profit), color: profit >= 0 ? 'bg-success' : 'bg-destructive' },
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-foreground/60 text-[9px]">{(b.val / 1000).toFixed(1)}k</span>
                <div className={`w-full rounded-t-md ${b.color}`} style={{ height: `${Math.max(10, (b.val / maxBar) * 160)}px` }} />
                <span className="text-foreground/40 text-[10px]">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-foreground/5 text-foreground font-bold">🏆 Top Selling Items</div>
          <div className="p-5">
            {topItems.length === 0 ? (
              <div className="text-center text-foreground/30 py-5">No data yet</div>
            ) : (
              topItems.map(([name, data], i) => (
                <div key={name} className="flex items-center gap-3 py-2 border-b border-foreground/5 last:border-0">
                  <span className="text-primary font-bold min-w-[20px]">#{i + 1}</span>
                  <span className="text-xl">{data.emoji}</span>
                  <div className="flex-1">
                    <div className="text-foreground text-sm">{name}</div>
                    <div className="text-foreground/40 text-[11px]">{data.total.toLocaleString()} IQD</div>
                  </div>
                  <span className="text-primary font-bold">{data.count}x</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Expense Details */}
      <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-foreground/5 text-foreground font-bold">💸 Expense Details</div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Date', 'Type', 'Description', 'Amount'].map(h => (
                <th key={h} className="bg-secondary text-foreground/50 text-[11px] tracking-wider p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredExp.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-foreground/30 py-5">No expenses</td></tr>
            ) : (
              filteredExp.map(e => (
                <tr key={e.id} className="border-b border-foreground/5">
                  <td className="p-3 text-foreground/50 text-sm">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="p-3 text-foreground text-sm">{{ electricity: '💡 Electricity', water: '💧 Water', salary: '👷 Salary', supplies: '📦 Supplies', other: '📝 Other' }[e.type]}</td>
                  <td className="p-3 text-foreground text-sm">{e.desc}</td>
                  <td className="p-3 text-destructive text-sm">{e.amount.toLocaleString()} IQD</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReports;
