import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { robotCategories, staffCategories } from '@/data/menuData';
import { menuImages } from '@/data/menuImages';
import { Language, MenuType, PaymentMethod, OrderType, CartItem, MenuItem } from '@/types';
import { Coffee, Globe, ShoppingCart, Minus, Plus, Check, Truck, UtensilsCrossed, Banknote, CreditCard, Smartphone, Zap, Bot, ChefHat, ChevronRight, User, Phone, MapPin } from 'lucide-react';

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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = (num: string) => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    canvas.width = 140; canvas.height = 140;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 140, 140);
    ctx.fillStyle = '#000000';
    const s = 7;
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, s*7, s); ctx.fillRect(x, y+s*6, s*7, s);
      ctx.fillRect(x, y, s, s*7); ctx.fillRect(x+s*6, y, s, s*7);
      ctx.fillRect(x+s*2, y+s*2, s*3, s*3);
    };
    drawFinder(0, 0); drawFinder(140-s*7, 0); drawFinder(0, 140-s*7);
    let seed = num.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let r = 0; r < 14; r++) for (let c = 0; c < 14; c++) {
      seed = (seed * 9301 + 49297) % 233280;
      if (seed / 233280 > 0.5) ctx.fillRect(49 + c * s, 49 + r * s, s - 1, s - 1);
    }
    ctx.fillStyle = '#333'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('#' + num, 70, 135);
  };

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
    setTimeout(() => generateQR(num), 100);
  };

  if (showLangSelect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
        <div className="text-center relative z-10 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Coffee className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">PLC</h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">Online Order</p>
          <p className="text-muted-foreground text-xs mb-8">ئۆردەری ئۆنلاین • طلب أونلاين • Online Order</p>
          <div className="flex flex-col gap-3 w-[280px] mx-auto">
            {[
              { code: 'ku' as Language, name: 'کوردی', sub: 'Kurdish' },
              { code: 'ar' as Language, name: 'العربية', sub: 'Arabic' },
              { code: 'en' as Language, name: 'English', sub: 'English' },
            ].map(l => (
              <button key={l.code} onClick={() => { setLanguage(l.code); setShowLangSelect(false); }}
                className="group w-full px-5 py-3.5 bg-card border border-border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:border-primary/40 hover:bg-primary/5">
                <div>
                  <span className="text-foreground font-semibold block">{l.name}</span>
                  <span className="text-muted-foreground text-xs">{l.sub}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coffee className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-foreground text-base font-bold">PLC</span>
            <span className="text-muted-foreground text-[10px] block leading-none">ONLINE ORDER</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLangSelect(true)} className="flex items-center gap-1.5 bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-xs hover:text-foreground transition-all">
            <Globe className="w-3.5 h-3.5" />
            {t.changeLang}
          </button>
          {cartCount > 0 && (
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              {cartCount}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Menu Type */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setMenuType('robot')}
            className={`flex-1 py-3.5 rounded-xl text-center transition-all border flex items-center justify-center gap-2.5 ${menuType === 'robot' ? 'border-info bg-info/5' : 'border-border bg-card'}`}>
            <Bot className={`w-5 h-5 ${menuType === 'robot' ? 'text-info' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-semibold ${menuType === 'robot' ? 'text-info' : 'text-muted-foreground'}`}>{t.tabRobot}</span>
          </button>
          <button onClick={() => setMenuType('staff')}
            className={`flex-1 py-3.5 rounded-xl text-center transition-all border flex items-center justify-center gap-2.5 ${menuType === 'staff' ? 'border-success bg-success/5' : 'border-border bg-card'}`}>
            <ChefHat className={`w-5 h-5 ${menuType === 'staff' ? 'text-success' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-semibold ${menuType === 'staff' ? 'text-success' : 'text-muted-foreground'}`}>{t.tabStaff}</span>
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm border ${
                activeCategory === cat.id
                  ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}>
              {cat.name[language]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map(item => (
              <button key={item.id} onClick={() => addToCart(item)}
                className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all text-left hover:border-primary/30 hover:shadow-lg">
                {menuImages[item.id] ? (
                  <img src={menuImages[item.id]} alt={item.name[language]} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center text-4xl bg-secondary opacity-40">{item.emoji}</div>
                )}
                <div className="p-3">
                  <div className="text-foreground text-sm font-semibold mb-0.5">{item.name[language]}</div>
                  <div className="text-muted-foreground text-[11px] mb-2">{item.desc[language]}</div>
                  <div className="text-primary text-base font-bold">{item.price.toLocaleString()} <span className="text-xs font-normal text-primary/60">IQD</span></div>
                </div>
              </button>
            ))}
          </div>

          {/* Order Panel */}
          <div className="bg-card rounded-xl border border-border overflow-hidden h-fit sticky top-20">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-foreground text-sm font-semibold">{t.orderTitle}</div>
                <div className="text-muted-foreground text-xs">{cartCount} {t.items}</div>
              </div>
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>

            <div className="max-h-52 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <div className="text-xs">{t.emptyCart}</div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-secondary rounded-lg p-2.5 mb-2 flex items-center gap-2 animate-slide-in">
                    {menuImages[item.id] ? (
                      <img src={menuImages[item.id]} alt="" className="w-9 h-9 rounded-md object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-base">{item.emoji}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-xs font-medium truncate">{item.name[language]}</div>
                      <div className="text-primary text-xs">{(item.price * item.qty).toLocaleString()} IQD</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 border border-border text-foreground rounded-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-foreground text-xs font-bold w-5 text-center">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 border border-border text-foreground rounded-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border">
              {/* Customer Info */}
              <div className="mb-4">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {language === 'ku' ? 'زانیاری کڕیار' : language === 'ar' ? 'معلومات العميل' : 'Customer Info'}
                </div>
                <div className="relative mb-2">
                  <input className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder={language === 'ku' ? 'ناوی تەواو' : language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="relative mb-2">
                  <input className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder={language === 'ku' ? 'ژمارەی مۆبایل' : language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
                {orderType === 'delivery' && (
                  <div className="relative">
                    <input className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder={language === 'ku' ? 'ناونیشان' : language === 'ar' ? 'العنوان' : 'Address'}
                      value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex justify-between mb-3 pt-2 border-t border-border">
                <span className="text-foreground font-bold text-sm">{t.total}</span>
                <span className="text-primary font-bold text-base">{cartTotal.toLocaleString()} IQD</span>
              </div>

              {/* Order Type */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                <button onClick={() => setOrderType('dine')}
                  className={`flex items-center gap-1.5 justify-center p-2 border rounded-lg text-[11px] font-medium transition-all ${orderType === 'dine' ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                  <UtensilsCrossed className="w-3.5 h-3.5" /> {t.dineIn}
                </button>
                <button onClick={() => setOrderType('delivery')}
                  className={`flex items-center gap-1.5 justify-center p-2 border rounded-lg text-[11px] font-medium transition-all ${orderType === 'delivery' ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                  <Truck className="w-3.5 h-3.5" /> {t.delivery}
                </button>
              </div>

              {/* Cash Payment */}
              <div className="mb-2">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1.5 font-medium">
                  {language === 'ku' ? '💵 کاش' : language === 'ar' ? '💵 نقداً' : '💵 Cash'}
                </div>
                <button onClick={() => setPayment('cash')}
                  className={`w-full flex items-center gap-1.5 justify-center p-2 border rounded-lg text-[11px] font-medium transition-all ${
                    payment === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary border-border text-muted-foreground'
                  }`}>
                  <Banknote className="w-3.5 h-3.5" /> {t.cash}
                </button>
              </div>

              {/* Online Payments */}
              {(() => {
                const cfg = (() => { try { const s = localStorage.getItem('plc_payment_config'); if(s) return JSON.parse(s); } catch{} return {fib:true,zain:true,fastpay:true}; })();
                const online = [
                  { id: 'fib' as PaymentMethod, icon: <CreditCard className="w-3.5 h-3.5" />, label: t.fibBank, show: cfg.fib },
                  { id: 'zain' as PaymentMethod, icon: <Smartphone className="w-3.5 h-3.5" />, label: t.zainCash, show: cfg.zain },
                  { id: 'fastpay' as PaymentMethod, icon: <Zap className="w-3.5 h-3.5" />, label: t.fastPay, show: cfg.fastpay },
                ].filter(m => m.show !== false);
                if (online.length === 0) return null;
                return (
                  <div className="mb-3">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1.5 font-medium">
                      {language === 'ku' ? '🌐 ئۆنلاین' : language === 'ar' ? '🌐 إلكتروني' : '🌐 Online'}
                    </div>
                    <div className={`grid gap-1.5 ${online.length === 1 ? 'grid-cols-1' : online.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {online.map(m => (
                        <button key={m.id} onClick={() => setPayment(m.id)}
                          className={`flex items-center gap-1.5 justify-center p-2 border rounded-lg text-[11px] font-medium transition-all ${
                            payment === m.id ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary border-border text-muted-foreground'
                          }`}>
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <button onClick={handleOrder}
                disabled={cart.length === 0 || !customerName || !customerPhone}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
                {t.placeOrder}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal with QR */}
      {showSuccess && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-modal-in">
            <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
              <Check className="w-7 h-7 text-success" />
            </div>
            <div className="text-foreground text-xl font-bold mb-1">{t.modalTitle}</div>
            <div className="text-muted-foreground text-sm mb-5">{t.modalSub}</div>
            <div className="bg-secondary border border-border rounded-xl py-4 px-8 mb-5 inline-block">
              <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1">{t.orderNumLabel}</div>
              <div className="text-primary text-4xl font-bold">#{orderNum}</div>
            </div>
            {/* QR Code */}
            <div className="mb-4">
              <canvas ref={qrCanvasRef} width={140} height={140} className="mx-auto bg-foreground rounded-lg" />
            </div>
            <div className="text-muted-foreground text-xs mb-4">{t.qrHint}</div>
            <p className="text-muted-foreground text-sm mb-5">
              {language === 'ku' ? 'ئۆردەرەکەت وەرگیرا! پەیوەندیت پێوە دەکرێت.' :
               language === 'ar' ? 'تم استلام طلبك! سنتواصل معك قريباً.' :
               'Your order has been received! We will contact you shortly.'}
            </p>
            <button onClick={() => { setShowSuccess(false); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); }}
              className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm cursor-pointer hover:opacity-90 transition-all">
              {t.modalOk}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineOrder;
