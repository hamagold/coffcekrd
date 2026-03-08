import { useState } from 'react';
import { MenuItem, MenuType, Language } from '@/types';
import { UtensilsCrossed, Plus, Trash2, Bot, ChefHat, Loader2, Pencil, FolderPlus, Tag } from 'lucide-react';
import { adminT } from '@/data/adminTranslations';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCategories } from '@/hooks/useCategories';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'sonner';

const AdminMenu = ({ lang }: { lang: Language }) => {
  const { robotItems, staffItems, loading, addItem, deleteItem, updateItem } = useMenuItems();
  const { robotCategories, staffCategories, addCategory, deleteCategory, loading: catsLoading } = useCategories();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [tab, setTab] = useState<MenuType>('robot');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ emoji: '', nameKu: '', nameAr: '', nameEn: '', price: '', cat: 'hot', type: 'robot' as MenuType, image: '' });
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editData, setEditData] = useState({ emoji: '', nameKu: '', nameAr: '', nameEn: '', price: '', cat: '', image: '' });
  const [newCat, setNewCat] = useState({ catId: '', icon: '', nameKu: '', nameAr: '', nameEn: '', menuType: 'robot' });

  const items = tab === 'robot' ? robotItems : staffItems;

  const handleAdd = async () => {
    const item: MenuItem = {
      id: 'custom_' + Date.now(), cat: newItem.cat, emoji: newItem.emoji || '☕',
      name: { ku: newItem.nameKu || 'نو', ar: newItem.nameAr || 'جديد', en: newItem.nameEn || 'New Item' },
      desc: { ku: '', ar: '', en: '' }, price: parseInt(newItem.price) || 0,
      image: newItem.image || undefined,
    };
    setSaving(true);
    try {
      await addItem(item, newItem.type);
      setShowModal(false);
      setNewItem({ emoji: '', nameKu: '', nameAr: '', nameEn: '', price: '', cat: 'hot', type: 'robot', image: '' });
      toast.success(lang === 'ku' ? 'ئایتم زیادکرا' : lang === 'ar' ? 'تمت الإضافة' : 'Item added');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success(lang === 'ku' ? 'ئایتم سڕایەوە' : lang === 'ar' ? 'تم الحذف' : 'Item deleted');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setEditData({
      emoji: item.emoji, nameKu: item.name.ku, nameAr: item.name.ar, nameEn: item.name.en,
      price: String(item.price), cat: item.cat, image: item.image || '',
    });
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await updateItem(editItem.id, {
        emoji: editData.emoji, cat: editData.cat,
        name: { ku: editData.nameKu, ar: editData.nameAr, en: editData.nameEn },
        desc: editItem.desc, price: parseInt(editData.price) || 0,
        image: editData.image || undefined,
      });
      setEditItem(null);
      toast.success(lang === 'ku' ? 'ئایتم نوێکرایەوە' : lang === 'ar' ? 'تم التحديث' : 'Item updated');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const allCategories = [...robotCategories, ...staffCategories];
  const catLabels: Record<string, string> = {};
  allCategories.forEach(c => { catLabels[c.id] = c.name[lang] || c.name.en; });
  const currentCategories = tab === 'robot' ? robotCategories : staffCategories;

  const handleAddCategory = async () => {
    if (!newCat.catId.trim()) {
      toast.error(lang === 'ku' ? 'ناسنامەی کاتەگۆری پێویستە' : 'Category ID required');
      return;
    }
    setSaving(true);
    try {
      await addCategory(newCat);
      setShowCatModal(false);
      setNewCat({ catId: '', icon: '', nameKu: '', nameAr: '', nameEn: '', menuType: 'robot' });
      toast.success(lang === 'ku' ? 'کاتەگۆری زیادکرا' : lang === 'ar' ? 'تمت الإضافة' : 'Category added');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await deleteCategory(catId);
      toast.success(lang === 'ku' ? 'کاتەگۆری سڕایەوە' : lang === 'ar' ? 'تم الحذف' : 'Category deleted');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div dir={dir}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" /> {t.menuManagement}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCatModal(true)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-all">
            <FolderPlus className="w-3.5 h-3.5" /> {lang === 'ku' ? 'کاتەگۆری' : lang === 'ar' ? 'فئة' : 'Category'}
          </button>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" /> {t.addItem}
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-4">
        <h3 className="text-foreground text-xs font-semibold mb-2 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" /> {lang === 'ku' ? 'کاتەگۆرییەکان' : lang === 'ar' ? 'الفئات' : 'Categories'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {currentCategories.map(cat => (
            <div key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs">
              <span>{cat.icon}</span>
              <span className="text-foreground font-medium">{cat.name[lang] || cat.name.en}</span>
              <button onClick={() => handleDeleteCategory(cat.id)} className="ml-1 text-destructive/60 hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
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
                <td className="p-3">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <span className="text-lg">{item.emoji}</span>
                  )}
                </td>
                <td className="p-3 text-foreground text-xs font-medium">{item.name[lang] || item.name.en}</td>
                <td className="p-3 text-muted-foreground text-xs">{catLabels[item.cat] || item.cat}</td>
                <td className="p-3 text-primary font-bold text-xs">{item.price.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${tab === 'robot' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>{tab === 'robot' ? t.robotMenu : t.staffMenu}</span>
                </td>
                <td className="p-3 flex gap-1.5">
                  <button onClick={() => openEdit(item)} className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md cursor-pointer hover:bg-primary/20 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
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
          <div className="bg-card border border-border rounded-xl p-6 min-w-[420px] max-h-[90vh] overflow-y-auto animate-modal-in">
            <h3 className="text-foreground text-base font-bold mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> {t.addItem}
            </h3>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">
                {lang === 'ku' ? 'وێنە' : lang === 'ar' ? 'صورة' : 'Image'}
              </label>
              <ImageUpload
                onUpload={(url) => setNewItem(p => ({ ...p, image: url }))}
                currentImage={newItem.image || undefined}
                folder="items"
              />
            </div>

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
              <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t.addItem}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-xl p-6 min-w-[420px] max-h-[90vh] overflow-y-auto animate-modal-in">
            <h3 className="text-foreground text-base font-bold mb-5 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" /> {lang === 'ku' ? 'دەستکاری ئایتم' : lang === 'ar' ? 'تعديل العنصر' : 'Edit Item'}
            </h3>

            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">
                {lang === 'ku' ? 'وێنە' : lang === 'ar' ? 'صورة' : 'Image'}
              </label>
              <ImageUpload
                onUpload={(url) => setEditData(p => ({ ...p, image: url }))}
                currentImage={editData.image || undefined}
                folder="items"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.emoji}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={editData.emoji} onChange={e => setEditData(p => ({ ...p, emoji: e.target.value }))} />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.category}</label>
                <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm" value={editData.cat} onChange={e => setEditData(p => ({ ...p, cat: e.target.value }))}>
                  {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameKu}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={editData.nameKu} onChange={e => setEditData(p => ({ ...p, nameKu: e.target.value }))} />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameEn}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={editData.nameEn} onChange={e => setEditData(p => ({ ...p, nameEn: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameAr}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={editData.nameAr} onChange={e => setEditData(p => ({ ...p, nameAr: e.target.value }))} />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.priceIqd}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="number" value={editData.price} onChange={e => setEditData(p => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted transition-all">{t.cancel}</button>
              <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {lang === 'ku' ? 'نوێکردنەوە' : lang === 'ar' ? 'تحديث' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-xl p-6 min-w-[400px] animate-modal-in">
            <h3 className="text-foreground text-base font-bold mb-5 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-primary" /> {lang === 'ku' ? 'زیادکردنی کاتەگۆری' : lang === 'ar' ? 'إضافة فئة' : 'Add Category'}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">ID</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newCat.catId} onChange={e => setNewCat(p => ({ ...p, catId: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="pasta" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.emoji}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))} placeholder="🍝" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameKu}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newCat.nameKu} onChange={e => setNewCat(p => ({ ...p, nameKu: e.target.value }))} placeholder="پاستا" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameEn}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newCat.nameEn} onChange={e => setNewCat(p => ({ ...p, nameEn: e.target.value }))} placeholder="Pasta" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.nameAr}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={newCat.nameAr} onChange={e => setNewCat(p => ({ ...p, nameAr: e.target.value }))} placeholder="معكرونة" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.menuType}</label>
                <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm" value={newCat.menuType} onChange={e => setNewCat(p => ({ ...p, menuType: e.target.value }))}>
                  <option value="robot">{t.robotMenu}</option>
                  <option value="staff">{t.staffMenu}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCatModal(false)} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted transition-all">{t.cancel}</button>
              <button onClick={handleAddCategory} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {lang === 'ku' ? 'زیادکردن' : lang === 'ar' ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
