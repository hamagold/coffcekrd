import { useState, useEffect, useRef } from 'react';
import OrderQRCode, { OrderQRCodeHandle } from '@/components/OrderQRCode';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInactivityRedirect } from '@/hooks/useInactivityRedirect';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { useCategories } from '@/hooks/useCategories';
import { menuImages } from '@/data/menuImages';
import { MenuType, PaymentMethod, OrderType, MenuItem } from '@/types';
import { isPaymentConfigured, fetchPaymentConfig, fetchPaymentLogos, PaymentConfig, PaymentLogos } from '@/components/admin/AdminPayments';
import { supabase } from '@/integrations/supabase/client';
import { fetchCafeConfig } from '@/hooks/useAdminLang';
import { fetchPLCConfig } from '@/components/admin/AdminPLC';
import { useVariants, Variant } from '@/hooks/useVariants';
import { Coffee, Globe, ShoppingCart, Minus, Plus, Printer, X, Check, Truck, UtensilsCrossed, Banknote, Bot, ChefHat, ArrowLeft, Coins, Loader2, ExternalLink, QrCode, ChevronLeft } from 'lucide-react';
import defaultFibLogo from '@/assets/payments/fib-logo.png';
import defaultZaincashLogo from '@/assets/payments/zaincash-logo.png';
import cash5000 from '@/assets/cash/5000.jpg';
import cash10000 from '@/assets/cash/10000.jpg';
import cash25000 from '@/assets/cash/25000.jpg';
import cash50000 from '@/assets/cash/50000.png';
import defaultFastpayLogo from '@/assets/payments/fastpay-logo.png';

const FROOZT_YELLOW = '#f6f26d';
const FROOZT_PINK = '#ffb0be';
const FROOZT_ICE = '#9eecff';
const FROOZT_LILAC = '#e2bdff';

type ViewState = 'categories' | 'items' | 'cart' | 'checkout';

const MenuScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, direction, robotItems, staffItems, cart, addToCart, changeQty, cartTotal, cartItemCount, placeOrder, clearCart } = useStore();
  const t = translations[language];
  const initialType = (searchParams.get('type') === 'staff' ? 'staff' : 'robot') as MenuType;
  const [menuType, setMenuType] = useState<MenuType>(initialType);
  const [activeCategory, setActiveCategory] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [orderType, setOrderType] = useState<OrderType>('dine');
  const [showModal, setShowModal] = useState(false);
  const [lastOrderNum, setLastOrderNum] = useState('');
  const [cashBalance, setCashBalance] = useState(0);
  const [view, setView] = useState<ViewState>('items');
  const { getVariantsForItem } = useVariants();
  const [variantItem, setVariantItem] = useState<MenuItem | null>(null);

  useInactivityRedirect(cartItemCount > 0 || cashBalance > 0);
  const [lastInserted, setLastInserted] = useState<number | null>(null);
  const [insertingAmount, setInsertingAmount] = useState<number | null>(null);
  const [balanceBump, setBalanceBump] = useState(false);
  const [plcMachineId, setPlcMachineId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'expired'>('pending');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<OrderQRCodeHandle>(null);
  const paymentPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load PLC machine ID and subscribe to realtime balance updates
  useEffect(() => {
    let channel: any;
    const setup = async () => {
      try {
        const plcConfig = await fetchPLCConfig();
        const machineId = plcConfig.machines?.[0]?.machineId || plcConfig.machineId || 'machine-01';
        setPlcMachineId(machineId);
        channel = supabase
          .channel(`plc-session-${machineId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'plc_sessions', filter: `machine_id=eq.${machineId}` },
            (payload: any) => {
              const newBalance = payload.new?.balance;
              if (typeof newBalance === 'number') {
                setCashBalance(prev => {
                  if (newBalance !== prev) { setBalanceBump(true); setLastInserted(newBalance - prev > 0 ? newBalance - prev : null); }
                  return newBalance;
                });
              }
            })
          .subscribe();
        const { data } = await supabase.from('plc_sessions').select('balance').eq('machine_id', machineId).eq('status', 'active').single();
        if (data) setCashBalance(data.balance);
      } catch (err) { console.log('PLC config load error:', err); }
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const { robotCategories, staffCategories } = useCategories();
  const categories = menuType === 'robot' ? robotCategories : staffCategories;
  const items = (menuType === 'robot' ? robotItems : staffItems).filter(i => i.cat === activeCategory);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
    setView('items');
  }, [menuType]);

  const selectCategory = (catId: string) => {
    setActiveCategory(catId);
    setView('items');
  };

  // --- Business logic (unchanged) ---
  useEffect(() => { return () => { if (paymentPollRef.current) clearInterval(paymentPollRef.current); }; }, []);

  const startPaymentPolling = (pId: string) => {
    if (paymentPollRef.current) clearInterval(paymentPollRef.current);
    let attempts = 0;
    paymentPollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 120) { if (paymentPollRef.current) clearInterval(paymentPollRef.current); setPaymentStatus('expired'); return; }
      try {
        const resp = await supabase.functions.invoke('check-payment', { body: { paymentId: pId } });
        if (resp.data?.status === 'paid') { if (paymentPollRef.current) clearInterval(paymentPollRef.current); setPaymentStatus('paid'); setTimeout(() => { setShowPaymentModal(false); setShowModal(true); }, 1500); }
        else if (resp.data?.status === 'failed' || resp.data?.status === 'cancelled') { if (paymentPollRef.current) clearInterval(paymentPollRef.current); setPaymentStatus('failed'); }
      } catch (err) { console.error('Payment poll error:', err); }
    }, 2500);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const isOnlinePayment = payment !== 'cash' && payment !== 'plc';
    if (isOnlinePayment) {
      if (!(await isPaymentConfigured(payment))) { const { toast } = await import('sonner'); toast.error(t.paymentNotConfigured); return; }
      setPaymentLoading(true);
      const currentCart = [...cart]; const currentTotal = cartTotal;
      try {
        const { getNextDailyOrderNumber } = await import('@/utils/orderCounter');
        const orderNum = getNextDailyOrderNumber();
        await supabase.from('orders').insert({ order_number: orderNum, items: currentCart as any, total: currentTotal, payment, order_type: orderType, lang: language, status: 'pending_payment', is_online: false });
        const resp = await supabase.functions.invoke('create-payment', { body: { provider: payment, amount: currentTotal, orderNumber: orderNum, lang: language } });
        setPaymentLoading(false);
        if (resp.data?.success) { setLastOrderNum(orderNum); setPaymentData(resp.data); setPaymentStatus('pending'); setShowPaymentModal(true); clearCart(); startPaymentPolling(resp.data.paymentId); }
        else { const { toast } = await import('sonner'); toast.error(resp.data?.error || 'Payment creation failed'); await supabase.from('orders').delete().eq('order_number', orderNum).eq('status', 'pending_payment'); }
      } catch (err: any) { setPaymentLoading(false); const { toast } = await import('sonner'); toast.error(err.message || 'Payment error'); }
      return;
    }
    const isRobotOrder = menuType === 'robot'; const currentCart = [...cart]; const currentTotal = cartTotal;
    const num = await placeOrder(payment, orderType);
    setLastOrderNum(num); setShowModal(true);
    if (isRobotOrder) {
      try {
        await supabase.functions.invoke('send-to-plc', { body: { orderNumber: num, items: currentCart.map(item => ({ id: item.id, plc_code: item.plc_code || 0, name: item.name, qty: item.qty, cat: item.cat })), total: currentTotal, payment } });
        const { toast } = await import('sonner');
        toast.success(language === 'ku' ? `🤖 ئۆردەر #${num} بۆ سیستەمی PLC نێردرا` : language === 'ar' ? `🤖 تم إرسال الطلب #${num} إلى نظام PLC` : `🤖 Order #${num} sent to PLC system`);
      } catch (err) { console.error('PLC auto-send error:', err); }
    }
  };

  const cancelPayment = async () => {
    if (paymentPollRef.current) clearInterval(paymentPollRef.current);
    if (lastOrderNum) await supabase.from('orders').delete().eq('order_number', lastOrderNum).eq('status', 'pending_payment');
    setShowPaymentModal(false); setPaymentData(null); setPaymentStatus('pending');
  };

  const [cafeName, setCafeName] = useState('PLC');
  useEffect(() => { fetchCafeConfig().then(cfg => setCafeName(cfg.name)); }, []);

  const doPrint = (orderNum: string) => {
    const qrDataUrl = qrRef.current?.getDataUrl() || '';
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<html><head><title>${cafeName}</title><style>@page{margin:5mm;size:80mm auto;}body{font-family:'Courier New',monospace;text-align:center;padding:10px;margin:0;}.line{border-top:1px dashed #000;margin:8px 0;}.big{font-size:42px;font-weight:bold;margin:8px 0;}.name{font-size:20px;font-weight:bold;margin:4px 0;}.info{font-size:12px;margin:3px 0;}.qr{margin:10px auto;}</style></head><body><div class=\"line\"></div><div class=\"name\">${cafeName} CAFETERIA</div><div class=\"line\"></div><div class=\"big\">#${orderNum}</div><div class=\"info\">${new Date().toLocaleString()}</div><div class=\"info\">Payment: ${payment.toUpperCase()} | Type: ${orderType.toUpperCase()}</div>${qrDataUrl ? `<img class=\"qr\" src=\"${qrDataUrl}\" width=\"120\" height=\"120\" />` : ''}<div class=\"line\"></div><div class=\"info\">THANK YOU / سپاسگوزارین / شكراً</div></body></html>`);
    doc.close();
    iframe.onload = () => { setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 300); };
  };
  const printLabel = () => doPrint(lastOrderNum);

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ cash: true, plc: true, fib: true, zain: true, fastpay: true });
  const [paymentLogos, setPaymentLogos] = useState<PaymentLogos>({});
  useEffect(() => {
    fetchPaymentConfig().then(cfg => {
      setPaymentConfig(cfg);
      // Auto-select first available payment if cash is disabled
      if (cfg.cash === false) {
        if (cfg.plc !== false) setPayment('plc');
        else if (cfg.fib !== false) setPayment('fib');
        else if (cfg.zain !== false) setPayment('zain');
        else if (cfg.fastpay !== false) setPayment('fastpay');
      }
    });
    fetchPaymentLogos().then(setPaymentLogos);
  }, []);

  const getFibLogo = () => paymentLogos.fib || defaultFibLogo;
  const getZainLogo = () => paymentLogos.zain || defaultZaincashLogo;
  const getFastpayLogo = () => paymentLogos.fastpay || defaultFastpayLogo;

  const onlinePaymentMethods = ([
    { id: 'fib' as PaymentMethod, icon: <img src={getFibLogo()} alt="FIB" className="w-5 h-5 object-contain" />, label: t.fibBank },
    { id: 'zain' as PaymentMethod, icon: <img src={getZainLogo()} alt="ZainCash" className="w-5 h-5 object-contain" />, label: t.zainCash },
    { id: 'fastpay' as PaymentMethod, icon: <img src={getFastpayLogo()} alt="FastPay" className="w-5 h-5 object-contain" />, label: t.fastPay },
  ] as { id: PaymentMethod; icon: React.ReactNode; label: string }[]).filter(m => paymentConfig[m.id] !== false);

  // Get first image from each category for category grid
  const getCategoryImage = (catId: string) => {
    const allItems = menuType === 'robot' ? robotItems : staffItems;
    const firstItem = allItems.find(i => i.cat === catId);
    if (firstItem) {
      if (menuImages[firstItem.id]) return menuImages[firstItem.id];
      if (firstItem.image) return firstItem.image;
    }
    return null;
  };

  const menuLabel = menuType === 'robot' ? (t.tabRobot || 'Robot Menu') : (t.tabStaff || 'Staff Menu');
  const headerTitle = view === 'categories'
    ? menuLabel
    : view === 'items'
      ? (language === 'ku' ? `${categories.find(c => c.id === activeCategory)?.name[language] || ''} هەڵبژێرە` : language === 'ar' ? `اختر ${categories.find(c => c.id === activeCategory)?.name[language] || ''}` : `Select ${categories.find(c => c.id === activeCategory)?.name[language] || ''}`)
      : view === 'cart'
        ? (language === 'ku' ? 'ئۆردەرەکەت' : language === 'ar' ? 'طلبك' : 'Your order')
        : (language === 'ku' ? 'پارەدان' : language === 'ar' ? 'الدفع' : 'Checkout');

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden relative" style={{ background: '#f8f8f8' }} dir={direction}>

      {/* ===== YELLOW HEADER BAR ===== */}
      <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between relative z-20" style={{ background: FROOZT_YELLOW }}>
        <div className="flex items-center gap-3">
          {view !== 'categories' && (
            <button
              onClick={() => {
                if (view === 'checkout') setView('cart');
                else if (view === 'cart') setView('items');
                else setView('categories');
              }}
              className="w-10 h-10 rounded-full border-2 border-black/80 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-black/80" />
            </button>
          )}
          <h1 className="text-black text-lg sm:text-xl font-black tracking-tight" style={{ fontFamily: "'Courier New', monospace" }}>
            {headerTitle}
          </h1>
        </div>
        <button
          onClick={() => navigate('/select')}
          className="text-black/60 hover:text-black text-xs font-bold cursor-pointer transition-colors"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          {language === 'ku' ? 'گەڕانەوە' : language === 'ar' ? 'رجوع' : 'BACK'}
        </button>
      </div>

      {/* Menu type tabs removed - selection happens on /select page */}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ===== CATEGORY SELECTION VIEW ===== */}
        {view === 'categories' && (
          <div className="flex-1 overflow-y-auto bg-white">

            {/* Category Grid - 3x2 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-8 pb-24">
              {categories.map((cat) => {
                const catImg = cat.image || getCategoryImage(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.id)}
                    className="group bg-white rounded-2xl border-2 border-black/10 overflow-hidden cursor-pointer transition-all hover:border-black/30 hover:shadow-lg active:scale-95"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-3">
                      {catImg ? (
                        <img src={catImg} alt={cat.name[language]} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <span className="text-4xl sm:text-5xl">{cat.icon}</span>
                      )}
                    </div>
                    <div className="px-2 py-2.5 sm:py-3 text-center border-t border-black/5">
                      <span className="text-[10px] sm:text-xs font-black text-black uppercase tracking-wider" style={{ fontFamily: "'Courier New', monospace" }}>
                        {cat.name[language]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== ITEMS VIEW ===== */}
        {view === 'items' && (
          <div className="flex-1 overflow-hidden flex">
            {/* Sidebar Categories */}
            <div className="w-28 sm:w-36 bg-white border-r border-black/10 overflow-y-auto shrink-0 py-3">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="w-full py-3 px-3 cursor-pointer text-left transition-all block"
                    style={{
                      borderLeft: isActive ? `3px solid ${FROOZT_YELLOW}` : '3px solid transparent',
                      background: isActive ? `${FROOZT_YELLOW}10` : 'transparent',
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    <span
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-wider block"
                      style={{ color: isActive ? '#1a1a1a' : '#999', textDecoration: isActive ? `underline` : 'none', textDecorationColor: FROOZT_YELLOW, textUnderlineOffset: '4px' }}
                    >
                      {cat.name[language]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-24">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const itemVariants = getVariantsForItem(item.id);
                      if (itemVariants.length > 0) {
                        setVariantItem(item);
                      } else {
                        addToCart(item);
                      }
                    }}
                    className="group bg-white rounded-2xl border-2 border-black/8 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-black/20 active:scale-[0.97] text-left"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                      {menuImages[item.id] ? (
                        <img src={menuImages[item.id]} alt={item.name[language]} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
                      ) : item.image ? (
                        <img src={item.image} alt={item.name[language]} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <span className="text-4xl opacity-40">{item.emoji}</span>
                      )}
                    </div>
                    <div className="px-3 py-2.5 text-center border-t border-black/5">
                      <div className="text-xs sm:text-sm font-bold text-black truncate" style={{ fontFamily: "'Courier New', monospace" }}>
                        {item.name[language]}
                      </div>
                      <div className="text-xs sm:text-sm font-bold mt-0.5" style={{ color: FROOZT_PINK, fontFamily: "'Courier New', monospace" }}>
                        IQD {item.price.toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== CART VIEW ===== */}
        {view === 'cart' && (
          <div className="flex-1 overflow-y-auto bg-white pb-24">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-black/15" />
                <div className="text-sm text-black/40 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>
                  {t.emptyCart}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                      {menuImages[item.id] ? (
                        <img src={menuImages[item.id]} alt="" className="w-full h-full object-contain" />
                      ) : item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl">{item.emoji}</span>
                      )}
                    </div>
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-black text-black" style={{ fontFamily: "'Courier New', monospace" }}>
                        {item.name[language]}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 border-2 border-black/20 rounded flex items-center justify-center cursor-pointer hover:bg-black/5 transition-all">
                          {item.qty === 1 ? <X className="w-3.5 h-3.5 text-black/60" /> : <Minus className="w-3.5 h-3.5 text-black/60" />}
                        </button>
                        <span className="text-sm font-black min-w-[24px] text-center text-black" style={{ fontFamily: "'Courier New', monospace" }}>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 border-2 border-black/20 rounded flex items-center justify-center cursor-pointer hover:bg-black/5 transition-all">
                          <Plus className="w-3.5 h-3.5 text-black/60" />
                        </button>
                      </div>
                    </div>
                    {/* Price */}
                    <div className="text-sm sm:text-base font-bold shrink-0" style={{ color: FROOZT_PINK, fontFamily: "'Courier New', monospace" }}>
                      IQD {(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="flex items-center justify-between px-5 py-5">
                  <div className="text-lg font-black text-black" style={{ fontFamily: "'Courier New', monospace" }}>
                    TOTAL: <span className="text-xs font-bold text-black/50">{cartItemCount} {language === 'ku' ? 'دانە' : language === 'ar' ? 'عناصر' : 'ITEMS'}</span>
                  </div>
                  <div className="text-lg font-black" style={{ color: FROOZT_PINK, fontFamily: "'Courier New', monospace" }}>
                    IQD {cartTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== CHECKOUT VIEW ===== */}
        {view === 'checkout' && (
          <div className="flex-1 overflow-y-auto bg-white pb-24 px-5 sm:px-8 pt-8">
            {/* Total Display */}
            <div className="text-center mb-8">
              <div className="text-lg font-black text-black uppercase tracking-wider" style={{ fontFamily: "'Courier New', monospace" }}>TOTAL:</div>
              <div className="text-3xl sm:text-4xl font-black mt-1" style={{ color: FROOZT_PINK, fontFamily: "'Courier New', monospace", textDecoration: 'underline', textDecorationColor: FROOZT_PINK, textUnderlineOffset: '6px' }}>
                IQD {cartTotal.toLocaleString()}
              </div>
            </div>

            <div className="border-t border-black/10 pt-6">
              {/* Payment Method */}
              <div className="text-xs font-bold text-black/50 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "'Courier New', monospace" }}>
                {language === 'ku' ? 'شێوازی پارەدان هەڵبژێرە:' : language === 'ar' ? 'اختر طريقة الدفع:' : 'SELECT YOUR PAYMENT METHOD:'}
              </div>

              {/* Cash options */}
              <div className="space-y-3 mb-4">
                {paymentConfig.cash !== false && (
                <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-black/3 transition-all">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment === 'cash' ? 'border-pink-400' : 'border-black/20'}`}>
                    {payment === 'cash' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: FROOZT_PINK }} />}
                  </div>
                  <div onClick={() => { setPayment('cash'); setCashBalance(0); setLastInserted(null); }}>
                    <span className="text-base font-bold text-black" style={{ fontFamily: "'Courier New', monospace" }}>Cash</span>
                    <span className="text-[10px] text-black/40 ml-2 uppercase tracking-wider" style={{ fontFamily: "'Courier New', monospace" }}>
                      {language === 'ku' ? 'کاش بەدەست' : language === 'ar' ? 'نقد يدوي' : 'MANUAL CASH'}
                    </span>
                  </div>
                </label>
                )}

                {paymentConfig.plc !== false && (
                  <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-black/3 transition-all">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment === 'plc' ? 'border-pink-400' : 'border-black/20'}`}>
                      {payment === 'plc' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: FROOZT_PINK }} />}
                    </div>
                    <div onClick={() => setPayment('plc')}>
                      <span className="text-base font-bold text-black" style={{ fontFamily: "'Courier New', monospace" }}>PLC Cash</span>
                      <span className="text-[10px] text-black/40 ml-2 uppercase tracking-wider" style={{ fontFamily: "'Courier New', monospace" }}>
                        {language === 'ku' ? 'کاش بە ئامێر' : language === 'ar' ? 'نقد PLC' : 'CASH MACHINE'}
                      </span>
                    </div>
                  </label>
                )}

                {/* PLC Balance section */}
                {payment === 'plc' && (
                  <div className="mx-3 rounded-xl border-2 border-black/10 p-4 bg-gray-50">
                    <div className={`text-center p-4 rounded-xl mb-3 ${cashBalance >= cartTotal && cartTotal > 0 ? 'bg-green-50 border-2 border-green-300' : cashBalance > 0 ? 'bg-amber-50 border-2 border-amber-300' : 'bg-white border-2 border-black/10'}`}>
                      <div className="text-[10px] text-black/40 uppercase tracking-[0.15em] mb-1 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>
                        {language === 'ku' ? 'باڵانس' : language === 'ar' ? 'الرصيد' : 'BALANCE'}
                      </div>
                      <div className={`text-2xl font-black ${cashBalance >= cartTotal && cartTotal > 0 ? 'text-green-600' : cashBalance > 0 ? 'text-amber-600' : 'text-black/30'}`} style={{ fontFamily: "'Courier New', monospace" }}>
                        {cashBalance.toLocaleString()} <span className="text-xs font-normal opacity-60">IQD</span>
                      </div>
                      {cartTotal > 0 && cashBalance < cartTotal && (
                        <div className="text-[10px] text-red-500 mt-1 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>
                          {(cartTotal - cashBalance).toLocaleString()} IQD {language === 'ku' ? 'پێویستە' : language === 'ar' ? 'مطلوب' : 'needed'}
                        </div>
                      )}
                      {cartTotal > 0 && cashBalance >= cartTotal && cashBalance - cartTotal > 0 && (
                        <div className="text-[10px] text-green-600 mt-1 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>
                          {language === 'ku' ? 'گەڕانەوە' : language === 'ar' ? 'الباقي' : 'Change'}: {(cashBalance - cartTotal).toLocaleString()} IQD
                        </div>
                      )}
                    </div>
                    <div className="text-center text-xs text-black/40 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span style={{ fontFamily: "'Courier New', monospace" }}>
                        {language === 'ku' ? 'چاوەڕوانی پارە...' : language === 'ar' ? 'في انتظار النقد...' : 'Waiting for cash...'}
                      </span>
                    </div>
                    {cashBalance > 0 && (
                      <button
                        onClick={async () => {
                          setCashBalance(0); setLastInserted(null);
                          try { await supabase.functions.invoke('plc-cash-insert', { body: { machine_id: plcMachineId || 'machine-01', action: 'reset' } }); } catch {}
                        }}
                        className="w-full mt-3 text-[10px] text-red-500 hover:text-red-400 font-bold" style={{ fontFamily: "'Courier New', monospace" }}
                      >
                        ✕ {language === 'ku' ? 'باڵانس بسڕەوە' : language === 'ar' ? 'مسح الرصيد' : 'Clear Balance'}
                      </button>
                    )}
                  </div>
                )}

                {/* Online payments */}
                {onlinePaymentMethods.map(m => (
                  <label key={m.id} className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-black/3 transition-all">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment === m.id ? 'border-pink-400' : 'border-black/20'}`}>
                      {payment === m.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: FROOZT_PINK }} />}
                    </div>
                    <div onClick={() => { setPayment(m.id); setCashBalance(0); }} className="flex items-center gap-2">
                      {m.icon}
                      <span className="text-base font-bold text-black" style={{ fontFamily: "'Courier New', monospace" }}>{m.label}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Order Type */}
              <div className="text-xs font-bold text-black/50 uppercase tracking-[0.2em] mb-3 mt-6" style={{ fontFamily: "'Courier New', monospace" }}>
                {language === 'ku' ? 'جۆری ئۆردەر:' : language === 'ar' ? 'نوع الطلب:' : 'ORDER TYPE:'}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setOrderType('dine')}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl cursor-pointer transition-all text-sm font-bold border-2"
                  style={{
                    background: orderType === 'dine' ? `${FROOZT_PINK}20` : 'white',
                    borderColor: orderType === 'dine' ? FROOZT_PINK : 'rgba(0,0,0,0.1)',
                    color: orderType === 'dine' ? '#1a1a1a' : '#999',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  {t.dineIn}
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl cursor-pointer transition-all text-sm font-bold border-2"
                  style={{
                    background: orderType === 'delivery' ? `${FROOZT_ICE}20` : 'white',
                    borderColor: orderType === 'delivery' ? FROOZT_ICE : 'rgba(0,0,0,0.1)',
                    color: orderType === 'delivery' ? '#1a1a1a' : '#999',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  <Truck className="w-4 h-4" />
                  {t.delivery}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div className="shrink-0 relative z-20 border-t-2 border-black/10">
        {/* Category view: show YOUR ORDER bar */}
        {(view === 'categories' || view === 'items') && (
          <div className="flex" style={{ fontFamily: "'Courier New', monospace" }}>
            <button
              onClick={() => setView('cart')}
              className="flex items-center gap-2 px-5 py-4 bg-white text-black/60 cursor-pointer hover:bg-black/3 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'ku' ? 'ئۆردەرەکەت' : language === 'ar' ? 'طلبك' : 'YOUR ORDER'}
              </span>
              {cartItemCount > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center" style={{ background: FROOZT_YELLOW, color: '#1a1a1a' }}>
                  {cartItemCount}
                </span>
              )}
            </button>
            <div className="flex-1 flex items-center justify-center px-4 py-4 text-xs font-bold uppercase tracking-wider" style={{ background: '#1a1a1a', color: 'white' }}>
              {cartItemCount === 0
                ? (language === 'ku' ? 'هیچ ئایتمێک نییە' : language === 'ar' ? 'لا توجد عناصر' : 'NO ORDERED ITEMS')
                : `${cartItemCount} ${language === 'ku' ? 'ئایتم' : language === 'ar' ? 'عنصر' : 'ITEMS'} — IQD ${cartTotal.toLocaleString()}`
              }
            </div>
          </div>
        )}

        {/* Cart view: KEEP SHOPPING / PAY NOW */}
        {view === 'cart' && (
          <div className="flex" style={{ fontFamily: "'Courier New', monospace" }}>
            <button
              onClick={() => setView('items')}
              className="flex-1 py-4 text-center cursor-pointer transition-all text-sm font-bold uppercase tracking-wider"
              style={{ background: FROOZT_PINK, color: 'white' }}
            >
              {language === 'ku' ? 'بازاڕی کردن بەردەوام بکە' : language === 'ar' ? 'تابع التسوق' : 'KEEP SHOPPING'}
            </button>
            <button
              onClick={() => { if (cart.length > 0) setView('checkout'); }}
              disabled={cart.length === 0}
              className="flex-1 py-4 text-center cursor-pointer transition-all text-sm font-black uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: FROOZT_YELLOW, color: '#1a1a1a' }}
            >
              {language === 'ku' ? 'ئێستا پارە بدە' : language === 'ar' ? 'ادفع الآن' : 'PAY NOW'}
            </button>
          </div>
        )}

        {/* Checkout view: Place Order button */}
        {view === 'checkout' && (
          <div className="flex" style={{ fontFamily: "'Courier New', monospace" }}>
            <button
              onClick={async () => {
                handlePlaceOrder();
                setCashBalance(0);
                if (payment === 'plc') {
                  try { await supabase.functions.invoke('plc-cash-insert', { body: { machine_id: plcMachineId || 'machine-01', action: 'reset' } }); } catch {}
                }
              }}
              disabled={cart.length === 0 || (payment === 'plc' && cashBalance < cartTotal) || paymentLoading}
              className="w-full py-4 text-center cursor-pointer transition-all text-sm font-black uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: FROOZT_YELLOW, color: '#1a1a1a' }}
            >
              {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {paymentLoading ? (language === 'ku' ? 'چاوەڕوان بە...' : language === 'ar' ? 'يرجى الانتظار...' : 'PROCESSING...') : (language === 'ku' ? 'ئۆردەر بدە ✓' : language === 'ar' ? 'اطلب الآن ✓' : 'PLACE ORDER ✓')}
            </button>
          </div>
        )}
      </div>

      {/* ===== PAYMENT PENDING MODAL ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-[1000] p-6">
          <div className="w-full max-w-[420px] text-center">
            {paymentStatus === 'pending' && (
              <>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: FROOZT_YELLOW }}>
                  <Loader2 className="w-10 h-10 animate-spin text-black/60" />
                </div>
                <div className="text-xl font-black text-black mb-1" style={{ fontFamily: "'Courier New', monospace" }}>{t.paymentPending}</div>
                <div className="text-sm text-black/40 mb-6" style={{ fontFamily: "'Courier New', monospace" }}>{t.paymentPendingDesc}</div>
                <div className="bg-gray-50 border-2 border-black/10 rounded-2xl py-4 px-8 mb-6 inline-block">
                  <div className="text-[10px] text-black/40 tracking-[0.2em] uppercase mb-1 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>{t.orderNumLabel}</div>
                  <div className="text-3xl font-black" style={{ color: FROOZT_PINK, fontFamily: "'Courier New', monospace" }}>#{lastOrderNum}</div>
                </div>
                {paymentData?.qrCode && (
                  <div className="mb-6">
                    <div className="bg-white rounded-2xl p-4 inline-block border-2 border-black/10"><img src={paymentData.qrCode} alt="Payment QR" className="w-48 h-48 mx-auto" /></div>
                  </div>
                )}
                {paymentData?.paymentLink && (
                  <div className="mb-6">
                    <a href={paymentData.paymentLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border-2 border-black/10 hover:bg-black/3"
                      style={{ fontFamily: "'Courier New', monospace" }}>
                      <ExternalLink className="w-4 h-4" />{t.paymentOpenLink}
                    </a>
                  </div>
                )}
                {paymentData?.readableCode && (
                  <div className="mb-6 bg-gray-50 rounded-xl p-3 border-2 border-black/10 inline-block">
                    <div className="text-2xl font-black tracking-widest text-black" style={{ fontFamily: "'Courier New', monospace" }}>{paymentData.readableCode}</div>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-black/30 text-xs mb-6"><Loader2 className="w-3 h-3 animate-spin" /><span style={{ fontFamily: "'Courier New', monospace" }}>{t.paymentWaiting}</span></div>
                <button onClick={cancelPayment} className="px-6 py-3 rounded-xl bg-gray-100 text-black font-bold text-sm cursor-pointer border-2 border-black/10 hover:bg-gray-200 transition-all" style={{ fontFamily: "'Courier New', monospace" }}>{t.paymentCancel}</button>
              </>
            )}
            {paymentStatus === 'paid' && (
              <>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: FROOZT_YELLOW }}>
                  <Check className="w-10 h-10 text-black/70" />
                </div>
                <div className="text-xl font-black text-black mb-1" style={{ fontFamily: "'Courier New', monospace" }}>{t.paymentSuccess}</div>
                <div className="text-sm text-green-600 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>{t.modalSub}</div>
              </>
            )}
            {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
              <>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-100"><X className="w-10 h-10 text-red-500" /></div>
                <div className="text-xl font-black text-black mb-1" style={{ fontFamily: "'Courier New', monospace" }}>{paymentStatus === 'expired' ? t.paymentExpired : t.paymentFailed}</div>
                <button onClick={() => { setShowPaymentModal(false); setPaymentData(null); }} className="mt-5 px-6 py-3 rounded-xl font-black text-sm cursor-pointer uppercase tracking-wider" style={{ background: FROOZT_YELLOW, color: '#1a1a1a', fontFamily: "'Courier New', monospace" }}>{t.modalOk}</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== ORDER SUCCESS MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-[1000] p-6">
          <div className="w-full max-w-[420px] text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: FROOZT_YELLOW }}>
              <span className="text-4xl">🤖</span>
            </div>
            <h2 className="text-2xl font-black text-black mb-1" style={{ fontFamily: "'Courier New', monospace" }}>
              {language === 'ku' ? 'سوپاس!' : language === 'ar' ? 'شكراً!' : 'Thank you!'}
            </h2>
            <p className="text-xs text-black/40 uppercase tracking-[0.15em] mb-6" style={{ fontFamily: "'Courier New', monospace" }}>
              {language === 'ku' ? 'ئۆردەرەکەت ئامادەدەکریت' : language === 'ar' ? 'بدأنا بتحضير طلبك' : 'WE STARTED PREPARING YOUR ORDER'}
              <br />
              {language === 'ku' ? 'و لە چەند خولەکێکدا ئامادەدەبێت.' : language === 'ar' ? 'وسيكون جاهزاً خلال دقائق.' : 'AND WILL BE DONE IN FEW MINUTES.'}
            </p>
            <div className="bg-gray-50 border-2 border-black/10 rounded-2xl py-4 px-8 mb-5 inline-block">
              <div className="text-[10px] text-black/40 tracking-[0.2em] uppercase mb-1 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>{t.orderNumLabel}</div>
              <div className="text-4xl font-black" style={{ color: FROOZT_PINK, fontFamily: "'Courier New', monospace" }}>#{lastOrderNum}</div>
            </div>
            <div className="mb-5"><OrderQRCode ref={qrRef} orderNumber={lastOrderNum} cafeName={cafeName} /></div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setShowModal(false); setView('categories'); }} className="px-6 py-3 rounded-xl font-black text-sm cursor-pointer uppercase tracking-wider" style={{ background: FROOZT_YELLOW, color: '#1a1a1a', fontFamily: "'Courier New', monospace" }}>{t.modalOk}</button>
              <button onClick={printLabel} className="px-6 py-3 rounded-xl bg-gray-100 text-black border-2 border-black/10 font-bold text-sm cursor-pointer hover:bg-gray-200 transition-all flex items-center gap-2" style={{ fontFamily: "'Courier New', monospace" }}>
                <Printer className="w-4 h-4" />{t.modalPrint}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== VARIANT SELECTION MODAL ===== */}
      {variantItem && (() => {
        const itemVariants = getVariantsForItem(variantItem.id);
        const itemImg = menuImages[variantItem.id] || variantItem.image;
        const allOptions = [
          { id: '__base', name: variantItem.name[language], price: variantItem.price, image: itemImg || null, isBase: true },
          ...itemVariants.map(v => ({
            id: v.id,
            name: language === 'ku' ? v.name_ku : language === 'ar' ? v.name_ar : v.name_en,
            price: v.price,
            image: v.image || null,
            isBase: false,
            variant: v,
          })),
        ];
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[1000]" onClick={() => setVariantItem(null)}>
            <div
              className="bg-white w-full max-w-[520px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
              style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Hero header with item image */}
              <div className="relative h-52 sm:h-60 bg-black flex items-center justify-center overflow-hidden">
                {itemImg ? (
                  <img src={itemImg} alt={variantItem.name[language]} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="text-7xl">{variantItem.emoji}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <button
                  onClick={() => setVariantItem(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/25 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white text-2xl font-black tracking-tight" style={{ fontFamily: "'Courier New', monospace" }}>
                    {variantItem.name[language]}
                  </h3>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.25em] mt-1" style={{ fontFamily: "'Courier New', monospace" }}>
                    {language === 'ku' ? 'جۆرێک هەڵبژێرە' : language === 'ar' ? 'اختر نوعاً' : 'SELECT AN OPTION'}
                  </p>
                </div>
              </div>

              {/* Variant cards */}
              <div className="p-4 sm:p-5 max-h-[45vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {allOptions.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (opt.isBase) {
                          addToCart(variantItem);
                        } else {
                          const variantMenuItem: MenuItem = {
                            ...variantItem,
                            id: `${variantItem.id}_v_${opt.id}`,
                            name: { ku: opt.variant.name_ku || variantItem.name.ku, ar: opt.variant.name_ar || variantItem.name.ar, en: opt.variant.name_en || variantItem.name.en },
                            price: opt.price,
                            image: opt.image || variantItem.image,
                            plc_code: opt.variant.plc_code || variantItem.plc_code,
                          };
                          addToCart(variantMenuItem);
                        }
                        setVariantItem(null);
                      }}
                      className="group rounded-2xl border-2 border-black/8 overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:border-black/20 active:scale-[0.96] text-left bg-white"
                    >
                      {/* Variant image */}
                      <div className="aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center relative">
                        {opt.image ? (
                          <img src={opt.image} alt={opt.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : itemImg ? (
                          <img src={itemImg} alt={opt.name} className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <span className="text-3xl opacity-30">{variantItem.emoji}</span>
                        )}
                        {opt.isBase && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: FROOZT_YELLOW, color: '#000', fontFamily: "'Courier New', monospace" }}>
                            {language === 'ku' ? 'ئاسایی' : language === 'ar' ? 'أصلي' : 'ORIGINAL'}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="px-3 py-3 text-center">
                        <div className="text-xs sm:text-sm font-bold text-black truncate" style={{ fontFamily: "'Courier New', monospace" }}>
                          {opt.name}
                        </div>
                        <div className="text-sm font-black mt-1" style={{ color: FROOZT_PINK, fontFamily: "'Courier New', monospace" }}>
                          IQD {opt.price.toLocaleString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom accent bar */}
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${FROOZT_YELLOW}, ${FROOZT_PINK})` }} />
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MenuScreen;
