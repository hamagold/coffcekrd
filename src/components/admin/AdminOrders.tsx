import { useStore } from '@/store/StoreContext';

const AdminOrders = () => {
  const { orders, clearOrders } = useStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-lg font-bold">🧾 All Orders</h2>
        <button onClick={clearOrders} className="px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-sm font-bold cursor-pointer">Clear All</button>
      </div>
      <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['#', 'Items', 'Total', 'Payment', 'Type', 'Time', 'Status'].map(h => (
                <th key={h} className="bg-secondary text-foreground/50 text-[11px] tracking-wider p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-foreground/30 py-8">No orders yet</td></tr>
            ) : (
              orders.slice().reverse().map(o => (
                <tr key={o.id} className="hover:bg-foreground/[0.02] border-b border-foreground/5">
                  <td className="p-3"><span className="bg-secondary border border-primary/30 px-2.5 py-1 rounded-md text-primary text-sm font-bold">#{o.id}</span></td>
                  <td className="p-3 text-foreground text-sm">{o.items?.map(i => `${i.emoji}×${i.qty}`).join(', ')}</td>
                  <td className="p-3 text-primary font-bold text-sm">{o.total.toLocaleString()} IQD</td>
                  <td className="p-3 text-foreground text-sm">{o.payment.toUpperCase()}</td>
                  <td className="p-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded ${o.type === 'delivery' ? 'bg-info/15 text-info' : 'bg-success/15 text-success'}`}>{o.type}</span>
                  </td>
                  <td className="p-3 text-foreground/40 text-sm">{new Date(o.time).toLocaleString('en-GB')}</td>
                  <td className="p-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">Done</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
