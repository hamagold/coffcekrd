import { useState, useEffect } from 'react';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { robotCategories, staffCategories } from '@/data/menuData';
import { menuImages } from '@/data/menuImages';
import { Language, MenuType, PaymentMethod, OrderType, CartItem, MenuItem } from '@/types';

const OnlineOrder = () => {
  const { robotItems, staffItems } = useStore();
  
  const [language, setLanguage] = useState<Language>('en');
  const [showLangSelect, setShowLangSelect] = useState(true);
  const [menuType, setMenuType] = useState<MenuType>('robot');
  const [activeCategory, setActiveCategory] = useState('hot');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const t = translations[language];
  const direction = language === 'en' ? 'ltr' : 'rtl';
  const categories = menuType === 'robot' ? robotCategories : staffCategories;
  const items = (menuType === 'robot' ? robotItems : staffItems).filter(i => i.cat === activeCategory);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    setActiveCategory(categories[0]?.id || '');
  }, [menuType]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  };

  const handleOrder = () => {
    if (cart.length === 0 || !customerName || !customerPhone) return;
    const counter = parseInt(localStorage.getItem('plc_order_counter') || '0') + 1;
    localStorage.setItem('plc_order_counter', String(counter));
    const num = String(counter).padStart(3, '0');
    
    const orders = JSON.parse(localStorage.getItem('plc_orders') || '[]');
    orders.push({
      id: num,
      items: cart,
      total: cartTotal,
      payment,
      type: orderType,
      time: new Date().toISOString(),
      lang: language,
      status: 'pending',
      customer: { name: customerName, phone: customerPhone, address: customerAddress },
      online: true,
    });
    localStorage.setItem('plc_orders', JSON.stringify(orders));
    
    setOrderNum(num);
    setShowSuccess(true);
    setCart([]);
  };

  if (showLangSelect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.1)_0%,transparent_70%)] animate-pulse-gold" />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-border">
            <span className="text-2xl font-black text-primary font-display">PLC</span>
          </div>
          <h1 className="text-3xl font-black text-primary font-display tracking-[6px] mb-2">PLC</h1>
          <p className="text-primary/60 tracking-[3px] text-sm mb-2">ONLINE ORDER</p>
          <p className="text-foreground/50 text-sm mb-8">ئۆردەری ئۆنلاین • طلب أونلاين • Online Order</p>
          <div className="flex gap-4 justify-center">
            {[
              { code: 'ku' as Language, flag: '🏔️', name: 'کوردی' },
              { code: 'ar' as Language, flag: '🌙', name: 'عربي' },
              { code: 'en' as Language, flag: '🌍', name: 'English' },
            ].map(l => (
              <button key={l.code} onClick={() => { setLanguage(l.code); setShowLangSelect(false); }}
                className="w-28 h-28 bg-gradient-to-br from-secondary to-background border-2 border-primary/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary hover:-translate-y-1 hover:shadow-[0_10px_30px_hsl(var(--gold)/0.2)]">
                <span className="text-4xl mb-2">{l.flag}</span>
                <span className="text-primary text-sm font-bold">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(0,0%,5%)] via-[hsl(43,30%,8%)] to-[hsl(0,0%,5%)] border-b-2 border-gold-dark px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-black text-primary font-display">PLC</span>
          </div>
          <div>
            <span className="text-primary text-lg font-black font-display tracking-[3px]">PLC</span>
            <span className="text-primary/40 text-xs block">ONLINE ORDER</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLangSelect(true)} className="bg-primary/10 border border-primary/30 text-primary/70 px-3 py-1 rounded-md text-xs">
            🌐 {t.changeLang}
          </button>
          {cartCount > 0 && (
            <div className="bg-primary text-background px-3 py-1 rounded-full text-sm font-bold">
              🛒 {cartCount}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Menu Type Tabs */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setMenuType('robot')}
            className={`flex-1 py-4 rounded-2xl text-center transition-all border-2 ${menuType === 'robot' ? 'border-info bg-info/10' : 'border-foreground/10 bg-secondary'}`}>
            <div className="text-2xl mb-1">🤖</div>
            <div className={`text-sm font-bold ${menuType === 'robot' ? 'text-info' : 'text-foreground/50'}`}>{t.tabRobot}</div>
          </button>
          <button onClick={() => setMenuType('staff')}
            className={`flex-1 py-4 rounded-2xl text-center transition-all border-2 ${menuType === 'staff' ? 'border-success bg-success/10' : 'border-foreground/10 bg-secondary'}`}>
            <div className="text-2xl mb-1">👨‍🍳</div>
            <div className={`text-sm font-bold ${menuType === 'staff' ? 'text-success' : 'text-foreground/50'}`}>{t.tabStaff}</div>
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm ${activeCategory === cat.id ? 'bg-primary text-background font-bold' : 'bg-secondary text-foreground/60 hover:bg-primary/10'}`}>
              <span>{cat.icon}</span> {cat.name[language]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {items.map(item => (
              <button key={item.id} onClick={() => addToCart(item)}
                className={`bg-gradient-to-br from-muted to-secondary border border-foreground/8 rounded-2xl overflow-hidden cursor-pointer transition-all text-left hover:-translate-y-1 hover:shadow-lg ${menuType === 'robot' ? 'hover:border-info' : 'hover:border-success'}`}>
                {menuImages[item.id] ? (
                  <img src={menuImages[item.id]} alt={item.name[language]} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center text-5xl bg-muted">{item.emoji}</div>
                )}
                <div className="p-3">
                  <div className="text-foreground text-sm font-bold mb-0.5">{item.name[language]}</div>
                  <div className="text-foreground/40 text-[11px] mb-2">{item.desc[language]}</div>
                  <div className="text-primary text-lg font-black">{item.price.toLocaleString()} <span className="text-xs text-primary/60">IQD</span></div>
                </div>
              </button>
            ))}
          </div>

          {/* Order Panel */}
          <div className="bg-secondary rounded-2xl border border-primary/20 overflow-hidden h-fit sticky top-24">
            <div className="px-5 py-4 bg-gradient-to-r from-[hsl(43,30%,8%)] to-background border-b border-primary/20">
              <div className="text-primary text-lg font-bold">{t.orderTitle}</div>
              <div className="text-foreground/50 text-sm">{cartCount} {t.items}</div>
            </div>

            {/* Cart Items */}
            <div className="max-h-60 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-foreground/20">
                  <div className="text-4xl mb-2">🛒</div>
                  <div className="text-sm">{t.emptyCart}</div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-muted rounded-lg p-2.5 mb-2 flex items-center gap-2 animate-slide-in">
                    {menuImages[item.id] ? (
                      <img src={menuImages[item.id]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-2xl">{item.emoji}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-xs font-semibold truncate">{item.name[language]}</div>
                      <div className="text-primary text-xs">{(item.price * item.qty).toLocaleString()} IQD</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 border border-primary/40 text-primary rounded-full flex items-center justify-center text-sm hover:bg-primary hover:text-background">−</button>
                      <span className="text-foreground text-xs font-bold w-5 text-center">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 border border-primary/40 text-primary rounded-full flex items-center justify-center text-sm hover:bg-primary hover:text-background">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-primary/20">
              {/* Customer Info */}
              <div className="mb-4">
                <div className="text-foreground/60 text-xs mb-2">📋 {language === 'ku' ? 'زانیاری کڕیار' : language === 'ar' ? 'معلومات العميل' : 'Customer Info'}</div>
                <input className="w-full p-2.5 bg-muted border border-foreground/10 rounded-lg text-foreground text-sm mb-2 focus:outline-none focus:border-primary"
                  placeholder={language === 'ku' ? 'ناوی تەواو' : language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  value={customerName} onChange={e => setCustomerName(e.target.value)} />
                <input className="w-full p-2.5 bg-muted border border-foreground/10 rounded-lg text-foreground text-sm mb-2 focus:outline-none focus:border-primary"
                  placeholder={language === 'ku' ? 'ژمارەی مۆبایل' : language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                {orderType === 'delivery' && (
                  <input className="w-full p-2.5 bg-muted border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
                    placeholder={language === 'ku' ? 'ناونیشان' : language === 'ar' ? 'العنوان' : 'Delivery Address'}
                    value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between mb-3 pt-2 border-t border-foreground/10">
                <span className="text-foreground font-black">{t.total}</span>
                <span className="text-primary font-black text-lg">{cartTotal.toLocaleString()} IQD</span>
              </div>

              {/* Order Type */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setOrderType('dine')}
                  className={`p-2 border-2 rounded-lg text-center text-xs transition-all ${orderType === 'dine' ? 'border-primary bg-primary/10 text-primary' : 'bg-muted border-foreground/10 text-foreground/60'}`}>
                  🍽️ {t.dineIn}
                </button>
                <button onClick={() => setOrderType('delivery')}
                  className={`p-2 border-2 rounded-lg text-center text-xs transition-all ${orderType === 'delivery' ? 'border-primary bg-primary/10 text-primary' : 'bg-muted border-foreground/10 text-foreground/60'}`}>
                  🛵 {t.delivery}
                </button>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {([
                  { id: 'cash' as PaymentMethod, icon: '💵', label: t.cash },
                  { id: 'fib' as PaymentMethod, icon: '🏦', label: t.fibBank },
                  { id: 'zain' as PaymentMethod, icon: '📱', label: t.zainCash },
                  { id: 'fastpay' as PaymentMethod, icon: '⚡', label: t.fastPay },
                ]).map(m => (
                  <button key={m.id} onClick={() => setPayment(m.id)}
                    className={`p-2 border-2 rounded-lg text-center text-[11px] transition-all ${payment === m.id ? 'border-primary bg-primary/10 text-primary' : 'bg-muted border-foreground/10 text-foreground/60'}`}>
                    <span className="block text-lg mb-0.5">{m.icon}</span>{m.label}
                  </button>
                ))}
              </div>

              <button onClick={handleOrder}
                disabled={cart.length === 0 || !customerName || !customerPhone}
                className="w-full py-3.5 bg-gradient-to-r from-gold-dark via-primary to-gold-dark border-none rounded-xl text-background text-base font-black cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_hsl(var(--gold)/0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                {t.placeOrder}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-background/85 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-gradient-to-br from-muted to-secondary border border-primary/30 rounded-3xl p-8 max-w-md w-full mx-4 text-center animate-modal-in">
            <div className="text-6xl mb-3">🎉</div>
            <div className="text-primary text-2xl font-bold mb-2">{t.modalTitle}</div>
            <div className="text-foreground/60 mb-4">{t.modalSub}</div>
            <div className="bg-muted border-2 border-primary rounded-2xl py-4 px-8 mb-4 inline-block">
              <div className="text-foreground/50 text-xs tracking-[3px]">{t.orderNumLabel}</div>
              <div className="text-primary text-4xl font-black font-display">#{orderNum}</div>
            </div>
            <p className="text-foreground/40 text-sm mb-4">
              {language === 'ku' ? 'ئۆردەرەکەت وەرگیرا! پەیوەندیت پێوە دەکرێت.' :
               language === 'ar' ? 'تم استلام طلبك! سنتواصل معك قريباً.' :
               'Your order has been received! We will contact you shortly.'}
            </p>
            <button onClick={() => { setShowSuccess(false); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); }}
              className="px-8 py-3 rounded-lg bg-primary text-background font-bold cursor-pointer hover:scale-105 transition-all">
              {t.modalOk}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineOrder;
