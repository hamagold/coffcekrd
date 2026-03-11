import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { useCategories } from '@/hooks/useCategories';
import { menuImages } from '@/data/menuImages';
import { MenuType, MenuItem, CartItem } from '@/types';
import { Bot, ChefHat, ShoppingCart, Minus, Plus, X, ArrowLeft } from 'lucide-react';

interface ClassicMenuProps {
  onCheckout: () => void;
}

const ClassicMenu = ({ onCheckout }: ClassicMenuProps) => {
  const { language, direction, robotItems, staffItems, cart, addToCart, changeQty, cartTotal, cartItemCount } = useStore();
  const t = translations[language];
  const [menuType, setMenuType] = useState<MenuType>('robot');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  const { robotCategories, staffCategories } = useCategories();
  const categories = menuType === 'robot' ? robotCategories : staffCategories;
  const allItems = menuType === 'robot' ? robotItems : staffItems;
  const catItems = allItems.filter(i => i.cat === activeCategory);

  // Get unique sub-categories for current category
  const subCats = [...new Set(catItems.map(i => i.subCat).filter(Boolean))] as string[];
  const hasSubCats = subCats.length > 0;

  // Items to display
  const displayItems = activeSubCat
    ? catItems.filter(i => i.subCat === activeSubCat)
    : catItems;

  // Get first image for sub-category
  const getSubCatImage = (subCat: string) => {
    const item = catItems.find(i => i.subCat === subCat);
    if (item) {
      if (menuImages[item.id]) return menuImages[item.id];
      if (item.image) return item.image;
    }
    return null;
  };

  const getCategoryImage = (catId: string) => {
    const firstItem = allItems.find(i => i.cat === catId);
    if (firstItem) {
      if (menuImages[firstItem.id]) return menuImages[firstItem.id];
      if (firstItem.image) return firstItem.image;
    }
    return null;
  };

  const getItemImage = (item: MenuItem) => {
    if (menuImages[item.id]) return menuImages[item.id];
    if (item.image) return item.image;
    return null;
  };

  // View state: 'categories' | 'subcats' | 'items'
  const viewState = !activeCategory ? 'categories' : (hasSubCats && !activeSubCat ? 'subcats' : 'items');

  const goBack = () => {
    if (activeSubCat) {
      setActiveSubCat(null);
    } else if (activeCategory) {
      setActiveCategory('');
    }
  };

  if (showCart) {
    return (
      <div className="flex flex-col h-full bg-background" dir={direction}>
        {/* Cart Header */}
        <div className="shrink-0 px-4 py-3 flex items-center gap-3 bg-card border-b border-border">
          <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center cursor-pointer hover:bg-muted transition-all">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h2 className="text-foreground font-bold text-base flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            {language === 'ku' ? 'ئۆردەرەکەت' : language === 'ar' ? 'طلبك' : 'Your Order'}
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">{t.emptyCart}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const img = getItemImage(item);
                return (
                  <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">{item.emoji}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground font-semibold text-sm truncate">{item.name[language]}</div>
                      <div className="text-primary font-bold text-xs">IQD {item.price.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center cursor-pointer hover:bg-muted transition-all">
                        {item.qty === 1 ? <X className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-foreground" />}
                      </button>
                      <span className="text-foreground font-bold text-sm min-w-[20px] text-center">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center cursor-pointer hover:bg-muted transition-all">
                        <Plus className="w-3 h-3 text-foreground" />
                      </button>
                    </div>
                    <div className="text-primary font-bold text-sm shrink-0">
                      {(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="shrink-0 border-t border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-bold text-base">
                {language === 'ku' ? 'کۆی گشتی' : language === 'ar' ? 'المجموع' : 'Total'}
              </span>
              <span className="text-primary font-bold text-lg">IQD {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCart(false)} className="flex-1 py-3 bg-secondary text-foreground rounded-xl text-sm font-bold cursor-pointer hover:bg-muted transition-all border border-border">
                {language === 'ku' ? 'بەردەوام بوون' : language === 'ar' ? 'تابع التسوق' : 'Keep Shopping'}
              </button>
              <button onClick={onCheckout} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold cursor-pointer hover:opacity-90 transition-all">
                {language === 'ku' ? 'پارەدان' : language === 'ar' ? 'الدفع' : 'Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background" dir={direction}>
      {/* Header */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between bg-card border-b border-border">
        <div className="flex items-center gap-3">
          {viewState !== 'categories' && (
            <button onClick={goBack} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center cursor-pointer hover:bg-muted transition-all">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h1 className="text-foreground font-bold text-base">
            {viewState === 'categories'
              ? (language === 'ku' ? 'مینۆ' : language === 'ar' ? 'القائمة' : 'Menu')
              : viewState === 'subcats'
                ? categories.find(c => c.id === activeCategory)?.name[language]
                : activeSubCat || categories.find(c => c.id === activeCategory)?.name[language]}
          </h1>
        </div>
        <button onClick={() => setShowCart(true)} className="relative p-2 cursor-pointer">
          <ShoppingCart className="w-5 h-5 text-foreground" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Menu Type Tabs */}
      {viewState === 'categories' && (
        <div className="shrink-0 flex bg-card border-b border-border">
          <button
            onClick={() => { setMenuType('robot'); setActiveCategory(''); setActiveSubCat(null); }}
            className={`flex-1 py-2.5 text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold ${menuType === 'robot' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            <Bot className="w-3.5 h-3.5" /> {t.tabRobot}
          </button>
          <button
            onClick={() => { setMenuType('staff'); setActiveCategory(''); setActiveSubCat(null); }}
            className={`flex-1 py-2.5 text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold ${menuType === 'staff' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            <ChefHat className="w-3.5 h-3.5" /> {t.tabStaff}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Categories Grid */}
        {viewState === 'categories' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const catImg = cat.image || getCategoryImage(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setActiveSubCat(null); }}
                  className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/30 active:scale-95"
                >
                  <div className="aspect-square overflow-hidden bg-secondary flex items-center justify-center p-4">
                    {catImg ? (
                      <img src={catImg} alt={cat.name[language]} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-4xl">{cat.icon}</span>
                    )}
                  </div>
                  <div className="px-2 py-2.5 text-center border-t border-border">
                    <span className="text-foreground text-xs font-bold">{cat.name[language]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-categories Grid */}
        {viewState === 'subcats' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* "All" option */}
            <button
              onClick={() => setActiveSubCat('__all__')}
              className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/30 active:scale-95"
            >
              <div className="aspect-square overflow-hidden bg-secondary flex items-center justify-center p-4">
                <span className="text-4xl">📋</span>
              </div>
              <div className="px-2 py-2.5 text-center border-t border-border">
                <span className="text-foreground text-xs font-bold">
                  {language === 'ku' ? 'هەمووی' : language === 'ar' ? 'الكل' : 'All'}
                </span>
              </div>
            </button>
            {subCats.map((sc) => {
              const scImg = getSubCatImage(sc);
              return (
                <button
                  key={sc}
                  onClick={() => setActiveSubCat(sc)}
                  className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/30 active:scale-95"
                >
                  <div className="aspect-square overflow-hidden bg-secondary flex items-center justify-center p-4">
                    {scImg ? (
                      <img src={scImg} alt={sc} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                  <div className="px-2 py-2.5 text-center border-t border-border">
                    <span className="text-foreground text-xs font-bold">{sc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Items Grid */}
        {viewState === 'items' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(activeSubCat === '__all__' ? catItems : displayItems).map((item) => {
              const img = getItemImage(item);
              const inCart = cart.find(c => c.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => !item.outOfStock && addToCart(item)}
                  disabled={item.outOfStock}
                  className={`bg-card rounded-xl border border-border overflow-hidden text-left transition-all ${item.outOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-95'}`}
                >
                  <div className="aspect-square overflow-hidden bg-secondary flex items-center justify-center p-2 relative">
                    {img ? (
                      <img src={img} alt={item.name[language]} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-3xl opacity-40">{item.emoji}</span>
                    )}
                    {item.outOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-white text-[10px] font-bold px-2 py-1 bg-destructive rounded-full">
                          {language === 'ku' ? 'نەماوە' : language === 'ar' ? 'نفذ' : 'OUT OF STOCK'}
                        </span>
                      </div>
                    )}
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                        {inCart.qty}
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-2 text-center border-t border-border">
                    <div className="text-foreground text-xs font-bold truncate">{item.name[language]}</div>
                    <div className="text-primary text-xs font-bold mt-0.5">IQD {item.price.toLocaleString()}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="shrink-0 border-t border-border bg-card">
        <button
          onClick={() => cartItemCount > 0 ? setShowCart(true) : undefined}
          className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground text-sm font-bold">
              {cartItemCount > 0
                ? `${cartItemCount} ${language === 'ku' ? 'ئایتم' : language === 'ar' ? 'عنصر' : 'items'}`
                : (language === 'ku' ? 'سەبەتە بەتاڵە' : language === 'ar' ? 'السلة فارغة' : 'Cart empty')}
            </span>
          </div>
          {cartItemCount > 0 && (
            <span className="text-primary font-bold text-sm">IQD {cartTotal.toLocaleString()}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ClassicMenu;
