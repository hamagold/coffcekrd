import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { robotCategories, staffCategories } from '@/data/menuData';
import { menuImages } from '@/data/menuImages';
import { MenuType, PaymentMethod, OrderType } from '@/types';
import { getCafeName } from '@/hooks/useAdminLang';
import { Coffee, Settings, Globe, ShoppingCart, Minus, Plus, Printer, X, Check, Truck, UtensilsCrossed, Banknote, CreditCard, Smartphone, Zap, Bot, ChefHat } from 'lucide-react';

const MenuScreen = () => {
  const navigate = useNavigate();
  const { language, direction, robotItems, staffItems, cart, addToCart, changeQty, cartTotal, cartItemCount, placeOrder, clearCart } = useStore();
  const t = translations[language];

  const [menuType, setMenuType] = useState<MenuType>('robot');
  const [activeCategory, setActiveCategory] = useState('hot');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [orderType, setOrderType] = useState<OrderType>('dine');
  const [showModal, setShowModal] = useState(false);
  const [lastOrderNum, setLastOrderNum] = useState('');
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
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

  const categories = menuType === 'robot' ? robotCategories : staffCategories;
  const items = (menuType === 'robot' ? robotItems : staffItems).filter(i => i.cat === activeCategory);

  useEffect(() => {
    setActiveCategory(categories[0]?.id || '');
  }, [menuType]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const num = await placeOrder(payment, orderType);
    setLastOrderNum(num);
    generateQR(num, cartTotal);
    setShowModal(true);
    // Auto-print after short delay
    setTimeout(() => autoPrintLabel(num), 500);
  };

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
    const w = window.open('', '_blank', 'width=400,height=300');
    if (!w) return;
    w.document.write(`<html><head><title>${cafeName} Order</title>
    <style>body{font-family:monospace;text-align:center;padding:20px;} .big{font-size:48px;font-weight:bold;}</style>
    </head><body>
    <div>━━━━━━━━━━━━━━━━━━━━</div>
    <div style="font-size:24px;font-weight:bold;">${cafeName} CAFETERIA</div>
    <div>━━━━━━━━━━━━━━━━━━━━</div>
    <div class="big">#${orderNum}</div>
    <div>${new Date().toLocaleString()}</div>
    <div>Payment: ${payment.toUpperCase()}</div>
    <div>Type: ${orderType.toUpperCase()}</div>
    <div>━━━━━━━━━━━━━━━━━━━━</div>
    <div>THANK YOU / سپاسگوزارین / شكراً</div>
    <script>window.print();<\/script>
    </body></html>`);
  };

  const autoPrintLabel = (orderNum: string) => doPrint(orderNum);
  const printLabel = () => doPrint(lastOrderNum);

  const paymentConfig = (() => {
    try {
      const saved = localStorage.getItem('plc_payment_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { fib: true, zain: true, fastpay: true };
  })();

  const onlinePaymentMethods = ([
    { id: 'fib' as PaymentMethod, icon: <CreditCard className="w-4 h-4" />, label: t.fibBank },
    { id: 'zain' as PaymentMethod, icon: <Smartphone className="w-4 h-4" />, label: t.zainCash },
    { id: 'fastpay' as PaymentMethod, icon: <Zap className="w-4 h-4" />, label: t.fastPay },
  ] as { id: PaymentMethod; icon: React.ReactNode; label: string }[]).filter(m => paymentConfig[m.id] !== false);

  return (
    <div className="flex flex-col w-full h-screen bg-background overflow-hidden" dir={direction}>
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coffee className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-foreground text-base font-bold tracking-wide">{cafeName}</span>
            <span className="text-muted-foreground text-[10px] block leading-none">CAFETERIA</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-foreground text-xl font-semibold tabular-nums">{clock}</div>
            <div className="text-muted-foreground text-xs">{dateStr}</div>
          </div>
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:text-foreground hover:border-primary/30 transition-all">
            <Globe className="w-3.5 h-3.5" />
            {t.changeLang}
          </button>
        </div>
      </div>

      {/* Menu Type Tabs */}
      <div className="flex bg-card border-b border-border shrink-0">
        <button
          onClick={() => setMenuType('robot')}
          className={`flex-1 py-4 text-center cursor-pointer transition-all border-b-2 flex items-center justify-center gap-3 ${menuType === 'robot' ? 'border-info bg-info/5' : 'border-transparent hover:bg-secondary'}`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${menuType === 'robot' ? 'bg-info/15 text-info' : 'bg-secondary text-muted-foreground'}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className={`text-sm font-semibold ${menuType === 'robot' ? 'text-info' : 'text-muted-foreground'}`}>{t.tabRobot}</div>
            <div className="text-[11px] text-muted-foreground">{t.tabRobotSub}</div>
          </div>
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => setMenuType('staff')}
          className={`flex-1 py-4 text-center cursor-pointer transition-all border-b-2 flex items-center justify-center gap-3 ${menuType === 'staff' ? 'border-success bg-success/5' : 'border-transparent hover:bg-secondary'}`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${menuType === 'staff' ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'}`}>
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className={`text-sm font-semibold ${menuType === 'staff' ? 'text-success' : 'text-muted-foreground'}`}>{t.tabStaff}</div>
            <div className="text-[11px] text-muted-foreground">{t.tabStaffSub}</div>
          </div>
        </button>
      </div>

      {/* Menu Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-44 bg-card border-r border-border overflow-y-auto shrink-0 py-2">
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
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm font-medium">{cat.name[language]}</span>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4 content-start">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all text-left hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(220_14%_4%/0.5)] animate-fade-up"
            >
              <div className="relative overflow-hidden">
                {menuImages[item.id] ? (
                  <img src={menuImages[item.id]} alt={item.name[language]} className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-36 bg-secondary flex items-center justify-center">
                    <span className="text-4xl opacity-40">{item.emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3.5">
                <div className="text-foreground text-sm font-semibold mb-0.5">{item.name[language]}</div>
                <div className="text-muted-foreground text-[11px] mb-2.5">{item.desc[language]}</div>
                <div className="text-primary text-base font-bold">{item.price.toLocaleString()} <span className="text-xs font-normal text-primary/60">IQD</span></div>
              </div>
            </button>
          ))}
        </div>

        {/* Order Panel */}
        <div className="w-80 bg-card border-l border-border flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-foreground text-sm font-semibold">{t.orderTitle}</div>
              <div className="text-muted-foreground text-xs">{cartItemCount} {t.items}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary" />
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

            {/* Cash Payment */}
            <div className="mb-2">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 font-medium">
                {language === 'ku' ? '💵 کاش' : language === 'ar' ? '💵 نقداً' : '💵 Cash'}
              </div>
              <button
                onClick={() => setPayment('cash')}
                className={`w-full flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-[11px] font-medium transition-all ${
                  payment === 'cash'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Banknote className="w-4 h-4" />
                {t.cash}
              </button>
            </div>

            {/* Online Payments */}
            {onlinePaymentMethods.length > 0 && (
              <div className="mb-3">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 font-medium">
                  {language === 'ku' ? '🌐 ئۆنلاین' : language === 'ar' ? '🌐 إلكتروني' : '🌐 Online'}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {onlinePaymentMethods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPayment(m.id)}
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
              onClick={handlePlaceOrder}
              disabled={cart.length === 0}
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
            <div className="bg-foreground w-36 h-36 mx-auto mb-5 rounded-lg flex items-center justify-center">
              <canvas ref={canvasRef} width={140} height={140} />
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

      {/* Admin link */}
      <button
        onClick={() => navigate('/admin')}
        className="fixed bottom-4 left-4 flex items-center gap-1.5 bg-card border border-border px-3 py-2 rounded-lg text-muted-foreground text-xs cursor-pointer transition-all hover:border-primary/30 hover:text-foreground z-50"
      >
        <Settings className="w-3.5 h-3.5" />
        Admin
      </button>
    </div>
  );
};

export default MenuScreen;
