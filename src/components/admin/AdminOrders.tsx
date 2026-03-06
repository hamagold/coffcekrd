import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Trash2, RefreshCw, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface DbOrder {
  id: string;
  order_number: string;
  items: any[];
  total: number;
  payment: string;
  order_type: string;
  lang: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  is_online: boolean;
  created_at: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('هەڵەی وەرگرتنی ئۆردەرەکان');
    } else {
      setOrders((data || []).map(d => ({ ...d, items: Array.isArray(d.items) ? d.items : [] })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Realtime subscription
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const clearOrders = async () => {
    const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      toast.error('هەڵەی سڕینەوەی ئۆردەرەکان');
    } else {
      setOrders([]);
      toast.success('هەموو ئۆردەرەکان سڕانەوە');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" /> هەموو ئۆردەرەکان
          <span className="text-muted-foreground text-xs font-normal flex items-center gap-1">
            <Wifi className="w-3 h-3 text-success" /> ڕاستەوخۆ
          </span>
        </h2>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="px-3 py-1.5 bg-secondary text-muted-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:text-foreground transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> نوێکردنەوە
          </button>
          <button onClick={clearOrders} className="px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:bg-destructive/20 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> سڕینەوەی هەمووی
          </button>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['#', 'ئایتمەکان', 'کۆی گشتی', 'پارەدان', 'جۆر', 'کات', 'بار'].map(h => (
                <th key={h} className="bg-secondary text-muted-foreground text-[10px] tracking-widest uppercase p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                {loading ? 'چاوەڕوان بە...' : 'هیچ ئۆردەرێک نییە'}
              </td></tr>
            ) : (
              orders.map(o => {
                const items = Array.isArray(o.items) ? o.items : [];
                return (
                  <tr key={o.id} className="hover:bg-secondary/50 border-b border-border transition-colors">
                    <td className="p-3">
                      <span className="bg-secondary border border-primary/20 px-2 py-0.5 rounded text-primary text-xs font-bold">#{o.order_number}</span>
                      {o.is_online && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-info/10 text-info font-semibold">ئۆنلاین</span>}
                    </td>
                    <td className="p-3 text-foreground text-xs">
                      {items.map((i: any) => `${i.name?.en || i.name} ×${i.qty}`).join(', ')}
                      {o.customer_name && <div className="text-muted-foreground text-[10px] mt-0.5">👤 {o.customer_name} {o.customer_phone && `• ${o.customer_phone}`}</div>}
                    </td>
                    <td className="p-3 text-primary font-bold text-xs">{o.total.toLocaleString()} IQD</td>
                    <td className="p-3 text-foreground text-xs uppercase">{o.payment}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${o.order_type === 'delivery' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>{o.order_type === 'delivery' ? 'گەیاندن' : 'لێرە'}</span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        o.status === 'done' ? 'bg-success/10 text-success border-success/20' :
                        o.status === 'preparing' ? 'bg-warning/10 text-warning border-warning/20' :
                        'bg-info/10 text-info border-info/20'
                      }`}>
                        {o.status === 'done' ? 'تەواو' : o.status === 'preparing' ? 'ئامادەکردن' : 'چاوەڕوانی'}
                      </span>
                    </td>
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

export default AdminOrders;
