import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInactivityRedirect } from '@/hooks/useInactivityRedirect';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { useCategories } from '@/hooks/useCategories';
import { menuImages } from '@/data/menuImages';
import { MenuType, PaymentMethod, OrderType } from '@/types';
import { isPaymentConfigured } from '@/components/admin/AdminPayments';
import { getCafeName } from '@/hooks/useAdminLang';
import { Coffee, Globe, ShoppingCart, Minus, Plus, Printer, X, Check, Truck, UtensilsCrossed, Banknote, CreditCard, Smartphone, Zap, Bot, ChefHat, Home, ArrowLeft, Coins, Menu as MenuIcon } from 'lucide-react';

const MenuScreen = () => {
  const navigate = useNavigate();
  const { language, direction, robotItems, staffItems, cart, addToCart, changeQty, cartTotal, cartItemCount, placeOrder, clearCart } = useStore();
  const t = translations[language];
  useInactivityRedirect();

  const [menuType, setMenuType] = useState<MenuType>('robot');
  const [activeCategory, setActiveCategory] = useState('hot');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [orderType, setOrderType] = useState<OrderType>('dine');
  const [showModal, setShowModal] = useState(false);
  const [lastOrderNum, setLastOrderNum] = useState('');
  const [cashBalance, setCashBalance] = useState(0);
  const [lastInserted, setLastInserted] = useState<number | null>(null);
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const { robotCategories, staffCategories } = useCategories();
  const categories = menuType === 'robot' ? robotCategories : staffCategories;
  const items = (menuType === 'robot' ? robotItems : staffItems).filter(i => i.cat === activeCategory);

  useEffect(() => {
    setActiveCategory(categories[0]?.id || '');
  }, [menuType]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    // Block if online payment selected but not configured
    if (payment !== 'cash' && payment !== 'plc' && !isPaymentConfigured(payment)) {
      const { toast } = await import('sonner');
      toast.error(
        language === 'ku' ? `⚠️ ${payment.toUpperCase()} ئامادە نییە - تکایە پەیوەندی بکە بە ئەدمین` :
        language === 'ar' ? `⚠️ ${payment.toUpperCase()} غير مُعد - تواصل مع المسؤول` :
        `⚠️ ${payment.toUpperCase()} is not configured - contact admin`
      );
      return;
    }
    const num = await placeOrder(payment, orderType);
    setLastOrderNum(num);
    setShowModal(true);
  };

  // Draw QR after modal renders and canvas is available
  useEffect(() => {
    if (showModal && lastOrderNum && canvasRef.current) {
      generateQR(lastOrderNum, cartTotal);
    }
  }, [showModal, lastOrderNum]);

  const generateQR = (orderNum: string, total: number) => {
    const canvas = canvasRef.current;
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
    let seed = orderNum.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let r = 0; r < 14; r++) for (let c = 0; c < 14; c++) {
      seed = (seed * 9301 + 49297) % 233280;
      if (seed / 233280 > 0.5) ctx.fillRect(49 + c * s, 49 + r * s, s - 1, s - 1);
    }
    ctx.fillStyle = '#333'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('#' + orderNum, 70, 135);
  };

  const cafeName = getCafeName();

  const doPrint = (orderNum: string) => {
    // Get QR as data URL
    const qrDataUrl = canvasRef.current?.toDataURL('image/png') || '';
    
    // Use hidden iframe for silent printing (no popup)
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    
    doc.open();
    doc.write(`<html><head><title>${cafeName}</title>
    <style>
      @page { margin: 5mm; size: 80mm auto; }
      body { font-family: 'Courier New', monospace; text-align: center; padding: 10px; margin: 0; }
      .line { border-top: 1px dashed #000; margin: 8px 0; }
      .big { font-size: 42px; font-weight: bold; margin: 8px 0; }
      .name { font-size: 20px; font-weight: bold; margin: 4px 0; }
      .info { font-size: 12px; margin: 3px 0; }
      .qr { margin: 10px auto; }
    </style>
    </head><body>
    <div class="line"></div>
    <div class="name">${cafeName} CAFETERIA</div>
    <div class="line"></div>
    <div class="big">#${orderNum}</div>
    <div class="info">${new Date().toLocaleString()}</div>
    <div class="info">Payment: ${payment.toUpperCase()} | Type: ${orderType.toUpperCase()}</div>
    ${qrDataUrl ? `<img class="qr" src="${qrDataUrl}" width="120" height="120" />` : ''}
    <div class="line"></div>
    <div class="info">THANK YOU / سپاسگوزارین / شكراً</div>
    </body></html>`);
    doc.close();
    
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 300);
    };
  };

  const autoPrintLabel = (orderNum: string) => doPrint(orderNum);
  const printLabel = () => doPrint(lastOrderNum);

  const paymentConfig = (() => {
    try {
      const saved = localStorage.getItem('plc_payment_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { plc: true, fib: true, zain: true, fastpay: true };
  })();

  const onlinePaymentMethods = ([
    { id: 'fib' as PaymentMethod, icon: <CreditCard className="w-4 h-4" />, label: t.fibBank },
    { id: 'zain' as PaymentMethod, icon: <Smartphone className="w-4 h-4" />, label: t.zainCash },
    { id: 'fastpay' as PaymentMethod, icon: <Zap className="w-4 h-4" />, label: t.fastPay },
  ] as { id: PaymentMethod; icon: React.ReactNode; label: string }[]).filter(m => paymentConfig[m.id] !== false);

  return (
    <div className="flex flex-col w-full h-screen bg-background overflow-hidden" dir={direction}>
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <span className="text-foreground text-sm sm:text-base font-bold tracking-wide">{cafeName}</span>
            <span className="text-muted-foreground text-[9px] sm:text-[10px] block leading-none">CAFETERIA</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-1.5 sm:gap-2 bg-primary/10 border border-primary/20 text-primary px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.backToHome || 'Home'}</span>
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-foreground text-xl font-semibold tabular-nums">{clock}</div>
            <div className="text-muted-foreground text-xs">{dateStr}</div>
          </div>
          <button onClick={() => navigate('/')} className="hidden md:flex items-center gap-1.5 bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:text-foreground hover:border-primary/30 transition-all">
            <Globe className="w-3.5 h-3.5" />
            {t.changeLang}
          </button>
          {/* Mobile cart toggle */}
          <button
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="lg:hidden relative flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Menu Type Tabs */}
      <div className="flex bg-card border-b border-border shrink-0">
        <button
          onClick={() => setMenuType('robot')}
          className={`flex-1 py-2.5 sm:py-4 text-center cursor-pointer transition-all border-b-2 flex items-center justify-center gap-2 sm:gap-3 ${menuType === 'robot' ? 'border-info bg-info/5' : 'border-transparent hover:bg-secondary'}`}
        >
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${menuType === 'robot' ? 'bg-info/15 text-info' : 'bg-secondary text-muted-foreground'}`}>
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
            <div className={`text-xs sm:text-sm font-semibold ${menuType === 'robot' ? 'text-info' : 'text-muted-foreground'}`}>{t.tabRobot}</div>
            <div className="text-[9px] sm:text-[11px] text-muted-foreground hidden sm:block">{t.tabRobotSub}</div>
          </div>
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => setMenuType('staff')}
          className={`flex-1 py-2.5 sm:py-4 text-center cursor-pointer transition-all border-b-2 flex items-center justify-center gap-2 sm:gap-3 ${menuType === 'staff' ? 'border-success bg-success/5' : 'border-transparent hover:bg-secondary'}`}
        >
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${menuType === 'staff' ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'}`}>
            <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
            <div className={`text-xs sm:text-sm font-semibold ${menuType === 'staff' ? 'text-success' : 'text-muted-foreground'}`}>{t.tabStaff}</div>
            <div className="text-[9px] sm:text-[11px] text-muted-foreground hidden sm:block">{t.tabStaffSub}</div>
          </div>
        </button>
      </div>

      {/* Mobile Categories (horizontal scroll) */}
      <div className="md:hidden flex gap-2 overflow-x-auto px-3 py-2 bg-card border-b border-border shrink-0">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium border transition-all ${
              activeCategory === cat.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-secondary text-muted-foreground'
            }`}
          >
            {cat.image ? (
              <img src={cat.image} alt="" className="w-4 h-4 rounded object-cover" />
            ) : (
              <span className="text-sm">{cat.icon}</span>
            )}
            {cat.name[language]}
          </button>
        ))}
      </div>

      {/* Menu Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar - hidden on mobile */}
        <div className="hidden md:block w-44 bg-card border-r border-border overflow-y-auto shrink-0 py-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full py-3 px-4 cursor-pointer text-left transition-all flex items-center gap-3 ${
                activeCategory === cat.id
                  ? 'bg-primary/8 border-l-2 border-l-primary text-foreground'
                  : 'border-l-2 border-l-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {cat.image ? (
                <img src={cat.image} alt="" className="w-6 h-6 rounded object-cover" />
              ) : (
                <span className="text-lg">{cat.icon}</span>
              )}
              <span className="text-sm font-medium">{cat.name[language]}</span>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2 sm:gap-4 content-start">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all text-left hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(220_14%_4%/0.5)] animate-fade-up"
            >
              <div className="relative overflow-hidden">
                {menuImages[item.id] ? (
                  <img src={menuImages[item.id]} alt={item.name[language]} className="w-full h-24 sm:h-36 object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : item.image ? (
                  <img src={item.image} alt={item.name[language]} className="w-full h-24 sm:h-36 object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-24 sm:h-36 bg-secondary flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl opacity-40">{item.emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-2 sm:p-3.5">
                <div className="text-foreground text-xs sm:text-sm font-semibold mb-0.5 truncate">{item.name[language]}</div>
                <div className="text-muted-foreground text-[10px] sm:text-[11px] mb-1.5 sm:mb-2.5 line-clamp-1 sm:line-clamp-2">{item.desc[language]}</div>
                <div className="text-primary text-sm sm:text-base font-bold">{item.price.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-primary/60">IQD</span></div>
              </div>
            </button>
          ))}
        </div>

        {/* Order Panel - overlay on mobile, sidebar on desktop */}
        {showMobileCart && <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowMobileCart(false)} />}
        <div className={`${showMobileCart ? 'fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[360px] shadow-2xl' : 'hidden'} lg:relative lg:block lg:w-80 bg-card border-l border-border flex flex-col shrink-0`}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-foreground text-sm font-semibold">{t.orderTitle}</div>
              <div className="text-muted-foreground text-xs">{cartItemCount} {t.items}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              <button onClick={() => setShowMobileCart(false)} className="lg:hidden w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <div className="text-sm">{t.emptyCart}</div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-secondary rounded-lg p-3 mb-2 flex items-center gap-2.5 animate-slide-in">
                  {menuImages[item.id] ? (
                    <img src={menuImages[item.id]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">{item.emoji}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground text-xs font-medium truncate">{item.name[language]}</div>
                    <div className="text-primary text-xs font-semibold">{(item.price * item.qty).toLocaleString()} IQD</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); changeQty(item.id, -1); }} className="w-6 h-6 border border-border bg-muted text-foreground rounded-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-foreground text-xs font-bold min-w-[18px] text-center">{item.qty}</span>
                    <button onClick={(e) => { e.stopPropagation(); changeQty(item.id, 1); }} className="w-6 h-6 border border-border bg-muted text-foreground rounded-md flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-secondary/50">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground text-xs">{t.subtotal}</span>
              <span className="text-foreground text-xs font-medium">{cartTotal.toLocaleString()} IQD</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border mt-2 mb-4">
              <span className="text-foreground text-base font-bold">{t.total}</span>
              <span className="text-primary text-base font-bold">{cartTotal.toLocaleString()} IQD</span>
            </div>

            {/* === CASH PAYMENT SECTION === */}
            <div className="mb-3">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
                💵 {language === 'ku' ? 'پارەدانی کاش' : language === 'ar' ? 'الدفع النقدي' : 'Cash Payment'}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {/* Manual Cash */}
                <button
                  onClick={() => { setPayment('cash'); setCashBalance(0); setLastInserted(null); }}
                  className={`flex items-center gap-1.5 p-2.5 border rounded-xl cursor-pointer text-[11px] font-medium transition-all ${
                    payment === 'cash'
                      ? 'border-success bg-success/10 text-success'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  {language === 'ku' ? 'کاش بەدەست' : language === 'ar' ? 'نقد يدوي' : 'Manual Cash'}
                </button>
                {/* PLC Vending */}
                {paymentConfig.plc !== false && (
                  <button
                    onClick={() => { setPayment('plc'); }}
                    className={`flex items-center gap-1.5 p-2.5 border rounded-xl cursor-pointer text-[11px] font-medium transition-all ${
                      payment === 'plc'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    {language === 'ku' ? 'کاش بە PLC' : language === 'ar' ? 'نقد PLC' : 'PLC Cash'}
                  </button>
                )}
              </div>

              {/* PLC Vending Machine UI - only when PLC selected */}
              {payment === 'plc' && (
                <div className="bg-secondary/50 rounded-xl border border-border p-3 mt-1">
                  {/* Balance Display */}
                  <div className={`relative overflow-hidden rounded-xl border-2 p-3 mb-2.5 text-center transition-all duration-500 ${
                    cashBalance >= cartTotal && cartTotal > 0
                      ? 'border-success bg-success/10'
                      : cashBalance > 0
                        ? 'border-warning bg-warning/10'
                        : 'border-border bg-secondary'
                  }`}>
                    {lastInserted && (
                      <div className="absolute inset-0 bg-success/20 animate-ping pointer-events-none rounded-xl" 
                        onAnimationEnd={() => setLastInserted(null)} />
                    )}
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      {language === 'ku' ? 'باڵانس' : language === 'ar' ? 'الرصيد' : 'Balance'}
                    </div>
                    <div className={`text-2xl font-bold tabular-nums transition-all duration-300 ${
                      cashBalance >= cartTotal && cartTotal > 0 ? 'text-success' : cashBalance > 0 ? 'text-warning' : 'text-muted-foreground'
                    }`}>
                      {cashBalance.toLocaleString()} <span className="text-xs font-normal opacity-60">IQD</span>
                    </div>
                    {cartTotal > 0 && cashBalance < cartTotal && (
                      <div className="text-[10px] text-destructive mt-1 font-medium">
                        {language === 'ku' ? `${(cartTotal - cashBalance).toLocaleString()} IQD پێویستە` : 
                         language === 'ar' ? `مطلوب ${(cartTotal - cashBalance).toLocaleString()} IQD` :
                         `${(cartTotal - cashBalance).toLocaleString()} IQD needed`}
                      </div>
                    )}
                    {cartTotal > 0 && cashBalance >= cartTotal && cashBalance - cartTotal > 0 && (
                      <div className="text-[10px] text-success mt-1 font-medium">
                        {language === 'ku' ? `گەڕانەوە: ${(cashBalance - cartTotal).toLocaleString()} IQD` :
                         language === 'ar' ? `الباقي: ${(cashBalance - cartTotal).toLocaleString()} IQD` :
                         `Change: ${(cashBalance - cartTotal).toLocaleString()} IQD`}
                      </div>
                    )}
                  </div>

                  {/* Denomination Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[1000, 5000, 10000, 25000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => {
                          setCashBalance(prev => prev + amount);
                          setLastInserted(amount);
                        }}
                        className="group relative flex flex-col items-center gap-0.5 p-2.5 border-2 border-dashed border-border rounded-xl cursor-pointer text-xs font-bold transition-all duration-200 bg-muted hover:border-success hover:bg-success/10 hover:scale-[1.03] active:scale-95 active:bg-success/20"
                      >
                        <Banknote className="w-5 h-5 text-muted-foreground group-hover:text-success transition-colors" />
                        <span className="text-foreground group-hover:text-success transition-colors">{amount.toLocaleString()}</span>
                        <span className="text-[9px] text-muted-foreground font-normal">IQD</span>
                      </button>
                    ))}
                  </div>

                  {cashBalance > 0 && (
                    <button
                      onClick={() => { setCashBalance(0); setLastInserted(null); }}
                      className="w-full mt-2 text-[10px] text-destructive hover:text-destructive/80 transition-colors font-medium"
                    >
                      {language === 'ku' ? '✕ باڵانس بسڕەوە' : language === 'ar' ? '✕ مسح الرصيد' : '✕ Clear Balance'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* === ONLINE PAYMENT SECTION === */}
            {onlinePaymentMethods.length > 0 && (
              <div className="mb-3">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 font-medium">
                  🌐 {language === 'ku' ? 'پارەدانی ئۆنلاین' : language === 'ar' ? 'الدفع الإلكتروني' : 'Online Payment'}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {onlinePaymentMethods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setPayment(m.id); setCashBalance(0); }}
                      className={`flex items-center gap-1.5 p-2 border rounded-lg cursor-pointer text-[11px] font-medium transition-all ${
                        payment === m.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 font-medium">{t.orderType}</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setOrderType('dine')}
                  className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-[11px] font-medium transition-all ${
                    orderType === 'dine'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  {t.dineIn}
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-[11px] font-medium transition-all ${
                    orderType === 'delivery'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  {t.delivery}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                handlePlaceOrder();
                setCashBalance(0);
              }}
              disabled={cart.length === 0 || (payment === 'plc' && cashBalance < cartTotal)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t.placeOrder}
            </button>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-2xl p-8 min-w-[400px] max-w-[480px] text-center animate-modal-in">
            <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
              <Check className="w-7 h-7 text-success" />
            </div>
            <div className="text-foreground text-xl font-bold mb-1">{t.modalTitle}</div>
            <div className="text-muted-foreground text-sm mb-6">{t.modalSub}</div>
            <div className="bg-secondary border border-border rounded-xl py-4 px-8 mb-5 inline-block">
              <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1">{t.orderNumLabel}</div>
              <div className="text-primary text-4xl font-bold">#{lastOrderNum}</div>
            </div>
            <div className="bg-white w-40 h-40 mx-auto mb-5 rounded-xl flex items-center justify-center shadow-lg border border-border">
              <canvas ref={canvasRef} width={140} height={140} className="rounded-md" />
            </div>
            <div className="text-muted-foreground text-xs mb-5">{t.qrHint}</div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm cursor-pointer transition-all hover:opacity-90">
                {t.modalOk}
              </button>
              <button onClick={printLabel} className="px-6 py-2.5 rounded-lg bg-secondary text-foreground border border-border font-semibold text-sm cursor-pointer transition-all hover:bg-muted flex items-center gap-2">
                <Printer className="w-4 h-4" />
                {t.modalPrint}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MenuScreen;
