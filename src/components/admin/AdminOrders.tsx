import { useStore } from '@/store/StoreContext';
import { ClipboardList, Trash2 } from 'lucide-react';

const AdminOrders = () => {
  const { orders, clearOrders } = useStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" /> All Orders
        </h2>
        <button onClick={clearOrders} className="px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:bg-destructive/20 transition-all">
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['#', 'Items', 'Total', 'Payment', 'Type', 'Time', 'Status'].map(h => (
                <th key={h} className="bg-secondary text-muted-foreground text-[10px] tracking-widest uppercase p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-8 text-sm">No orders yet</td></tr>
            ) : (
              orders.slice().reverse().map(o => (
                <tr key={o.id} className="hover:bg-secondary/50 border-b border-border transition-colors">
                  <td className="p-3"><span className="bg-secondary border border-primary/20 px-2 py-0.5 rounded text-primary text-xs font-bold">#{o.id}</span></td>
                  <td className="p-3 text-foreground text-xs">{o.items?.map(i => `${i.name.en} ×${i.qty}`).join(', ')}</td>
                  <td className="p-3 text-primary font-bold text-xs">{o.total.toLocaleString()} IQD</td>
                  <td className="p-3 text-foreground text-xs uppercase">{o.payment}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${o.type === 'delivery' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>{o.type}</span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(o.time).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Done</span></td>
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
