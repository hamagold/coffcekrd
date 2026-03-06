import { useStore } from '@/store/StoreContext';

const AdminDashboard = () => {
  const { orders, expenses } = useStore();
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
    { icon: '💰', value: `${revenue.toLocaleString()} IQD`, label: "Today's Revenue", color: 'primary' },
    { icon: '🧾', value: todayOrders.length, label: 'Total Orders Today', color: 'success' },
    { icon: '🤖', value: robotOrders.length, label: 'Robot Orders', color: 'info' },
    { icon: '👨‍🍳', value: staffOrders.length, label: 'Staff Orders', color: 'destructive' },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-muted rounded-2xl p-5 border border-foreground/5 relative overflow-hidden">
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className={`text-3xl font-black mb-1 text-${s.color}`}>{s.value}</div>
            <div className="text-foreground/40 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        {/* Recent Orders */}
        <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-foreground/5 flex items-center justify-between">
            <span className="text-foreground font-bold">📋 Recent Orders</span>
          </div>
          <div className="p-5">
            {todayOrders.length === 0 ? (
              <div className="text-center text-foreground/30 py-8">No orders yet today</div>
            ) : (
              todayOrders.slice(-8).reverse().map(o => (
                <div key={o.id} className="flex items-center gap-3 py-2.5 border-b border-foreground/5 last:border-b-0">
                  <span className="bg-secondary border border-primary/30 px-2.5 py-1 rounded-md text-primary text-sm font-bold min-w-[60px] text-center">#{o.id}</span>
                  <div className="flex-1">
                    <div className="text-foreground text-sm">{o.items?.map(i => i.emoji).join(' ')}</div>
                    <div className="text-foreground/40 text-[11px]">{new Date(o.time).toLocaleTimeString('en-GB')} · {o.payment} · {o.type}</div>
                  </div>
                  <div className="text-primary text-sm font-bold">{o.total.toLocaleString()} IQD</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">Done</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today Summary */}
        <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-foreground/5">
            <span className="text-foreground font-bold">📊 Today Summary</span>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <div className="text-foreground/40 text-[11px] tracking-wider mb-2">PAYMENT BREAKDOWN</div>
              {[
                { icon: '💵', label: 'Cash', method: 'cash' },
                { icon: '🏦', label: 'FIB Bank', method: 'fib' },
                { icon: '📱', label: 'ZainCash', method: 'zain' },
                { icon: '⚡', label: 'FastPay', method: 'fastpay' },
              ].map(p => (
                <div key={p.method} className="flex justify-between mb-2">
                  <span className="text-foreground/60">{p.icon} {p.label}</span>
                  <span className="text-primary">{paymentBreakdown(p.method).toLocaleString()} IQD</span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <div className="text-foreground/40 text-[11px] tracking-wider mb-2">EXPENSES TODAY</div>
              {[
                { icon: '💡', label: 'Electricity', type: 'electricity' },
                { icon: '💧', label: 'Water', type: 'water' },
                { icon: '👷', label: 'Salaries', type: 'salary' },
              ].map(e => (
                <div key={e.type} className="flex justify-between mb-2">
                  <span className="text-foreground/60">{e.icon} {e.label}</span>
                  <span className="text-destructive">{expByType(e.type).toLocaleString()} IQD</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-foreground/5 flex justify-between">
              <span className="text-foreground/60">Net Profit Today</span>
              <span className={`font-bold ${revenue - totalExp >= 0 ? 'text-success' : 'text-destructive'}`}>
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
