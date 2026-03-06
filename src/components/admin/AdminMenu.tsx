import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { MenuItem, MenuType } from '@/types';

const AdminMenu = () => {
  const { robotItems, staffItems, setRobotItems, setStaffItems } = useStore();
  const [tab, setTab] = useState<MenuType>('robot');
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ emoji: '', nameKu: '', nameAr: '', nameEn: '', price: '', cat: 'hot', type: 'robot' as MenuType });

  const items = tab === 'robot' ? robotItems : staffItems;

  const categories = tab === 'robot'
    ? ['hot', 'cold', 'shake', 'juice']
    : ['sandwich', 'food', 'dessert', 'salad'];

  const handleAdd = () => {
    const item: MenuItem = {
      id: 'custom_' + Date.now(),
      cat: newItem.cat,
      emoji: newItem.emoji || '🍽️',
      name: { ku: newItem.nameKu || 'نو', ar: newItem.nameAr || 'جديد', en: newItem.nameEn || 'New Item' },
      desc: { ku: '', ar: '', en: '' },
      price: parseInt(newItem.price) || 0,
    };
    if (newItem.type === 'robot') setRobotItems(prev => [...prev, item]);
    else setStaffItems(prev => [...prev, item]);
    setShowModal(false);
    setNewItem({ emoji: '', nameKu: '', nameAr: '', nameEn: '', price: '', cat: 'hot', type: 'robot' });
  };

  const handleDelete = (id: string) => {
    if (tab === 'robot') setRobotItems(prev => prev.filter(i => i.id !== id));
    else setStaffItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-lg font-bold">🍽️ Menu Management</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">+ Add Item</button>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('robot')} className={`px-5 py-2 rounded-lg text-sm font-bold border-2 ${tab === 'robot' ? 'border-info bg-info/10 text-info' : 'bg-secondary border-transparent text-foreground/50'}`}>🤖 Robot Menu</button>
        <button onClick={() => setTab('staff')} className={`px-5 py-2 rounded-lg text-sm font-bold border-2 ${tab === 'staff' ? 'border-success bg-success/10 text-success' : 'bg-secondary border-transparent text-foreground/50'}`}>👨‍🍳 Staff Menu</button>
      </div>

      <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Item', 'Name (EN)', 'Category', 'Price (IQD)', 'Type', 'Actions'].map(h => (
                <th key={h} className="bg-secondary text-foreground/50 text-[11px] tracking-wider p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="hover:bg-foreground/[0.02] border-b border-foreground/5">
                <td className="p-3 text-2xl">{item.emoji}</td>
                <td className="p-3 text-foreground text-sm">{item.name.en}</td>
                <td className="p-3 text-foreground text-sm">{item.cat}</td>
                <td className="p-3 text-primary font-bold text-sm">{item.price.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded ${tab === 'robot' ? 'bg-info/15 text-info' : 'bg-success/15 text-success'}`}>{tab}</span>
                </td>
                <td className="p-3">
                  <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-destructive/20 text-destructive border border-destructive/30 rounded text-[11px] font-bold cursor-pointer">🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-muted border border-primary/30 rounded-2xl p-8 min-w-[420px] animate-modal-in">
            <h3 className="text-primary text-xl font-bold mb-5">➕ Add Menu Item</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">EMOJI</label>
                <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" value={newItem.emoji} onChange={e => setNewItem(p => ({ ...p, emoji: e.target.value }))} placeholder="☕" />
              </div>
              <div>
                <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">MENU TYPE</label>
                <select className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm" value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value as MenuType }))}>
                  <option value="robot">🤖 Robot Menu</option>
                  <option value="staff">👨‍🍳 Staff Menu</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">NAME (Kurdish)</label>
                <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" value={newItem.nameKu} onChange={e => setNewItem(p => ({ ...p, nameKu: e.target.value }))} placeholder="قاوە" />
              </div>
              <div>
                <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">NAME (English)</label>
                <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" value={newItem.nameEn} onChange={e => setNewItem(p => ({ ...p, nameEn: e.target.value }))} placeholder="Coffee" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">NAME (Arabic)</label>
                <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" value={newItem.nameAr} onChange={e => setNewItem(p => ({ ...p, nameAr: e.target.value }))} placeholder="قهوة" />
              </div>
              <div>
                <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">PRICE (IQD)</label>
                <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="3500" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">CATEGORY</label>
              <select className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm" value={newItem.cat} onChange={e => setNewItem(p => ({ ...p, cat: e.target.value }))}>
                <option value="hot">Hot Drinks</option><option value="cold">Cold Drinks</option>
                <option value="shake">Shakes</option><option value="juice">Juices</option>
                <option value="sandwich">Sandwiches</option><option value="food">Food</option>
                <option value="dessert">Desserts</option><option value="salad">Salads</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-sm font-bold cursor-pointer">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">Add Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
