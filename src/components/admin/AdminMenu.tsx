import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { MenuItem, MenuType, Language } from '@/types';
import { UtensilsCrossed, Plus, Trash2, Bot, ChefHat } from 'lucide-react';
import { adminT } from '@/data/adminTranslations';

const AdminMenu = ({ lang }: { lang: Language }) => {
  const { robotItems, staffItems, setRobotItems, setStaffItems } = useStore();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [tab, setTab] = useState<MenuType>('robot');
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ emoji: '', nameKu: '', nameAr: '', nameEn: '', price: '', cat: 'hot', type: 'robot' as MenuType });

  const items = tab === 'robot' ? robotItems : staffItems;

  const handleAdd = () => {
    const item: MenuItem = {
      id: 'custom_' + Date.now(), cat: newItem.cat, emoji: newItem.emoji || '☕',
      name: { ku: newItem.nameKu || 'نو', ar: newItem.nameAr || 'جديد', en: newItem.nameEn || 'New Item' },
      desc: { ku: '', ar: '', en: '' }, price: parseInt(newItem.price) || 0,
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

  const catLabels: Record<string, string> = {
    hot: t.hotDrinks, cold: t.coldDrinks, shake: t.shakes, juice: t.juices,
    sandwich: t.sandwiches, food: t.food, dessert: t.desserts, salad: t.salads,
  };

  return (
    <div dir={dir}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" /> {t.menuManagement}
        </h2>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> {t.addItem}
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('robot')} className={`px-4 py-2 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${tab === 'robot' ? 'border-info bg-info/10 text-info' : 'bg-secondary border-border text-muted-foreground'}`}>
          <Bot className="w-3.5 h-3.5" /> {t.robotMenu}
        </button>
        <button onClick={() => setTab('staff')} className={`px-4 py-2 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${tab === 'staff' ? 'border-success bg-success/10 text-success' : 'bg-secondary border-border text-muted-foreground'}`}>
          <ChefHat className="w-3.5 h-3.5" /> {t.staffMenu}
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {[t.item, t.nameEn, t.category, t.priceIqd, t.menuType, t.actions].map(h => (
                <th key={h} className="bg-secondary text-muted-foreground text-[10px] tracking-widest uppercase p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="hover:bg-secondary/50 border-b border-border transition-colors">
                <td className="p-3 text-lg">{item.emoji}</td>
                <td className="p-3 text-foreground text-xs font-medium">{item.name[lang] || item.name.en}</td>
                <td className="p-3 text-muted-foreground text-xs">{catLabels[item.cat] || item.cat}</td>
                <td className="p-3 text-primary font-bold text-xs">{item.price.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${tab === 'robot' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>{tab === 'robot' ? t.robotMenu : t.staffMenu}</span>
                </td>
                <td className="p-3">
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-md cursor-pointer hover:bg-destructive/20 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-xl p-6 min-w-[420px] animate-modal-in">
            <h3 className="text-foreground text-base font-bold mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> {t.addItem}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.emoji}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newItem.emoji} onChange={e => setNewItem(p => ({ ...p, emoji: e.target.value }))} placeholder="☕" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.menuType}</label>
                <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm" value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value as MenuType }))}>
                  <option value="robot">{t.robotMenu}</option>
                  <option value="staff">{t.staffMenu}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameKu}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newItem.nameKu} onChange={e => setNewItem(p => ({ ...p, nameKu: e.target.value }))} placeholder="قاوە" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameEn}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newItem.nameEn} onChange={e => setNewItem(p => ({ ...p, nameEn: e.target.value }))} placeholder="Coffee" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameAr}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newItem.nameAr} onChange={e => setNewItem(p => ({ ...p, nameAr: e.target.value }))} placeholder="قهوة" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.priceIqd}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="3500" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.category}</label>
              <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm" value={newItem.cat} onChange={e => setNewItem(p => ({ ...p, cat: e.target.value }))}>
                {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted transition-all">{t.cancel}</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all">{t.addItem}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
