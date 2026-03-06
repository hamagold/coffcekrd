import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { robotCategories, staffCategories } from '@/data/menuData';
import { MenuType, PaymentMethod, OrderType } from '@/types';

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
      setClock(now.toLocaleTimeString('en-GB'));
      setDateStr(now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
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

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const num = placeOrder(payment, orderType);
    setLastOrderNum(num);
    generateQR(num, cartTotal);
    setShowModal(true);
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

  const printLabel = () => {
    const w = window.open('', '_blank', 'width=400,height=300');
    if (!w) return;
    w.document.write(`<html><head><title>PLC Order Label</title>
    <style>body{font-family:monospace;text-align:center;padding:20px;} .big{font-size:48px;font-weight:bold;}</style>
    </head><body>
    <div>━━━━━━━━━━━━━━━━━━━━</div>
    <div style="font-size:24px;font-weight:bold;">☕ PLC CAFETERIA</div>
    <div>━━━━━━━━━━━━━━━━━━━━</div>
    <div class="big">#${lastOrderNum}</div>
    <div>${new Date().toLocaleString()}</div>
    <div>Payment: ${payment.toUpperCase()}</div>
    <div>Type: ${orderType.toUpperCase()}</div>
    <div>━━━━━━━━━━━━━━━━━━━━</div>
    <div>THANK YOU / سپاسگوزارین / شكراً</div>
    <script>window.print();<\/script>
    </body></html>`);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-background overflow-hidden" dir={direction}>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[hsl(0,0%,5%)] via-[hsl(43,30%,8%)] to-[hsl(0,0%,5%)] border-b-2 border-gold-dark px-8 py-3 flex items-center justify-between shrink-0">
        <span className="text-primary text-2xl font-black font-display tracking-[4px]">☕ PLC</span>
        <div className="text-center">
          <div className="text-foreground text-3xl font-light tracking-wider tabular-nums">{clock}</div>
          <div className="text-primary/60 text-sm">{dateStr}</div>
        </div>
        <div className="text-right">
          <div className="text-primary text-sm">{t.welcome}</div>
          <button onClick={() => navigate('/')} className="bg-primary/10 border border-primary/30 text-primary/70 px-3 py-1 rounded-md text-xs cursor-pointer mt-1">
            🌐 {t.changeLang}
          </button>
        </div>
      </div>

      {/* Menu Type Tabs */}
      <div className="flex bg-secondary border-b border-primary/20 shrink-0">
        <button
          onClick={() => setMenuType('robot')}
          className={`flex-1 py-5 text-center cursor-pointer transition-all border-b-[3px] ${menuType === 'robot' ? 'border-info bg-info/10' : 'border-transparent'}`}
        >
          <div className="text-3xl mb-1">🤖</div>
          <div className={`text-base font-bold ${menuType === 'robot' ? 'text-info' : 'text-foreground/50'}`}>{t.tabRobot}</div>
          <div className="text-xs text-foreground/40">{t.tabRobotSub}</div>
        </button>
        <button
          onClick={() => setMenuType('staff')}
          className={`flex-1 py-5 text-center cursor-pointer transition-all border-b-[3px] ${menuType === 'staff' ? 'border-success bg-success/10' : 'border-transparent'}`}
        >
          <div className="text-3xl mb-1">👨‍🍳</div>
          <div className={`text-base font-bold ${menuType === 'staff' ? 'text-success' : 'text-foreground/50'}`}>{t.tabStaff}</div>
          <div className="text-xs text-foreground/40">{t.tabStaffSub}</div>
        </button>
      </div>

      {/* Menu Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-40 bg-muted border-r border-primary/15 overflow-y-auto shrink-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full py-4 px-3 cursor-pointer border-b border-foreground/5 text-center transition-all ${activeCategory === cat.id ? 'bg-primary/10 border-l-[3px] border-l-primary' : 'hover:bg-primary/5'}`}
            >
              <div className="text-2xl">{cat.icon}</div>
              <div className="text-foreground text-[11px] mt-1">{cat.name[language]}</div>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 content-start">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className={`bg-gradient-to-br from-muted to-secondary border border-foreground/8 rounded-2xl p-4 cursor-pointer transition-all relative overflow-hidden text-left hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] ${menuType === 'robot' ? 'hover:border-info' : 'hover:border-success'}`}
            >
              <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs ${menuType === 'robot' ? 'bg-info/30 border border-info' : 'bg-success/30 border border-success'}`}>
                {menuType === 'robot' ? '🤖' : '👨‍🍳'}
              </div>
              <span className="text-5xl text-center block mb-2.5">{item.emoji}</span>
              <div className="text-foreground text-[15px] font-bold mb-1">{item.name[language]}</div>
              <div className="text-foreground/40 text-[11px] mb-2.5 leading-relaxed">{item.desc[language]}</div>
              <div className="text-primary text-xl font-black">{item.price.toLocaleString()} <span className="text-xs text-primary/60">IQD</span></div>
            </button>
          ))}
        </div>

        {/* Order Panel */}
        <div className="w-80 bg-secondary border-l border-primary/20 flex flex-col shrink-0">
          <div className="px-5 py-4 bg-gradient-to-r from-[hsl(43,30%,8%)] to-background border-b border-primary/20">
            <div className="text-primary text-lg font-bold">{t.orderTitle}</div>
            <div className="text-foreground/50 text-sm">{cartItemCount} {t.items}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-foreground/20">
                <div className="text-5xl mb-3">🛒</div>
                <div>{t.emptyCart}</div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-muted rounded-lg p-3 mb-2 flex items-center gap-2.5 animate-slide-in">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground text-sm font-semibold truncate">{item.name[language]}</div>
                    <div className="text-primary text-xs">{(item.price * item.qty).toLocaleString()} IQD</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 border border-primary/40 bg-transparent text-primary rounded-full flex items-center justify-center text-base hover:bg-primary hover:text-background transition-all">−</button>
                    <span className="text-foreground text-sm font-bold min-w-[20px] text-center">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 border border-primary/40 bg-transparent text-primary rounded-full flex items-center justify-center text-base hover:bg-primary hover:text-background transition-all">+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-primary/20 bg-muted">
            <div className="flex justify-between mb-1.5">
              <span className="text-foreground/50 text-sm">{t.subtotal}</span>
              <span className="text-primary text-sm font-semibold">{cartTotal.toLocaleString()} IQD</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-foreground/10 mt-1">
              <span className="text-foreground text-xl font-black">{t.total}</span>
              <span className="text-primary text-xl font-black">{cartTotal.toLocaleString()} IQD</span>
            </div>

            <div className="mt-4">
              <div className="text-foreground/60 text-xs mb-2">{t.payMethod}</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {([
                  { id: 'cash' as PaymentMethod, icon: '💵', label: t.cash },
                  { id: 'fib' as PaymentMethod, icon: '🏦', label: t.fibBank },
                  { id: 'zain' as PaymentMethod, icon: '📱', label: t.zainCash },
                  { id: 'fastpay' as PaymentMethod, icon: '⚡', label: t.fastPay },
                ]).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayment(m.id)}
                    className={`p-2 border-2 rounded-lg cursor-pointer text-center transition-all text-[11px] ${payment === m.id ? 'border-primary bg-primary/10 text-primary' : 'bg-muted border-foreground/10 text-foreground/60'}`}
                  >
                    <span className="text-lg block mb-0.5">{m.icon}</span>{m.label}
                  </button>
                ))}
              </div>

              <div className="text-foreground/60 text-xs mb-2">{t.orderType}</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setOrderType('dine')}
                  className={`p-2 border-2 rounded-lg cursor-pointer text-center text-[11px] transition-all ${orderType === 'dine' ? 'border-[hsl(var(--purple))] bg-[hsl(var(--purple)/0.15)] text-[hsl(var(--purple))]' : 'bg-muted border-foreground/10 text-foreground/60'}`}
                >
                  🍽️ {t.dineIn}
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`p-2 border-2 rounded-lg cursor-pointer text-center text-[11px] transition-all ${orderType === 'delivery' ? 'border-[hsl(var(--purple))] bg-[hsl(var(--purple)/0.15)] text-[hsl(var(--purple))]' : 'bg-muted border-foreground/10 text-foreground/60'}`}
                >
                  🛵 {t.delivery}
                </button>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-gradient-to-r from-gold-dark via-primary to-gold-dark border-none rounded-xl text-background text-lg font-black cursor-pointer transition-all tracking-wider hover:scale-[1.02] hover:shadow-[0_8px_24px_hsl(var(--gold)/0.4)]"
              >
                {t.placeOrder}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/85 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-gradient-to-br from-muted to-secondary border border-primary/30 rounded-3xl p-10 min-w-[400px] max-w-[500px] text-center animate-modal-in">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-primary text-2xl font-bold mb-2">{t.modalTitle}</div>
            <div className="text-foreground/60 text-base mb-6">{t.modalSub}</div>
            <div className="bg-muted border-2 border-primary rounded-2xl py-5 px-10 mb-5 inline-block">
              <div className="text-foreground/50 text-xs tracking-[3px]">{t.orderNumLabel}</div>
              <div className="text-primary text-5xl font-black font-display">#{lastOrderNum}</div>
            </div>
            <div className="bg-foreground w-40 h-40 mx-auto mb-5 rounded-xl flex items-center justify-center">
              <canvas ref={canvasRef} width={140} height={140} />
            </div>
            <div className="text-foreground/40 text-xs mb-5">{t.qrHint}</div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 rounded-lg bg-primary text-background font-bold text-base cursor-pointer transition-all hover:scale-105">
                {t.modalOk}
              </button>
              <button onClick={printLabel} className="px-8 py-3 rounded-lg bg-muted text-foreground border border-foreground/15 font-bold text-base cursor-pointer transition-all hover:scale-105">
                {t.modalPrint}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin link */}
      <a
        href="/admin"
        onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
        className="fixed bottom-5 left-5 bg-background/80 border border-primary/30 px-4 py-2 rounded-lg text-primary/50 text-xs cursor-pointer transition-all hover:border-primary hover:text-primary z-50"
      >
        ⚙️ Admin
      </a>
    </div>
  );
};

export default MenuScreen;
