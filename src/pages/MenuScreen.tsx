import { useState, useEffect, useRef } from 'react';
import OrderQRCode, { OrderQRCodeHandle } from '@/components/OrderQRCode';
import { useNavigate } from 'react-router-dom';
import { useInactivityRedirect } from '@/hooks/useInactivityRedirect';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { useCategories } from '@/hooks/useCategories';
import { menuImages } from '@/data/menuImages';
import { MenuType, PaymentMethod, OrderType } from '@/types';
import { isPaymentConfigured, fetchPaymentConfig, fetchPaymentLogos, PaymentConfig, PaymentLogos } from '@/components/admin/AdminPayments';
import { supabase } from '@/integrations/supabase/client';
import { fetchCafeConfig } from '@/hooks/useAdminLang';
import { fetchPLCConfig } from '@/components/admin/AdminPLC';
import { Coffee, Globe, ShoppingCart, Minus, Plus, Printer, X, Check, Truck, UtensilsCrossed, Banknote, Bot, ChefHat, ArrowLeft, Coins, Loader2, ExternalLink, QrCode } from 'lucide-react';
import defaultFibLogo from '@/assets/payments/fib-logo.png';
import defaultZaincashLogo from '@/assets/payments/zaincash-logo.png';
import cash5000 from '@/assets/cash/5000.jpg';
import cash10000 from '@/assets/cash/10000.jpg';
import cash25000 from '@/assets/cash/25000.jpg';
import cash50000 from '@/assets/cash/50000.png';
import defaultFastpayLogo from '@/assets/payments/fastpay-logo.png';

const FROOZT_COLORS = {
  banana: '#f6f26d',
  ice: '#9eecff',
  pink: '#ffb0be',
  lilac: '#e2bdff',
};

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
  const [cashBalance, setCashBalance] = useState(0);

  useInactivityRedirect(cartItemCount > 0 || cashBalance > 0);
  const [lastInserted, setLastInserted] = useState<number | null>(null);
  const [insertingAmount, setInsertingAmount] = useState<number | null>(null);
  const [balanceBump, setBalanceBump] = useState(false);
  const [plcMachineId, setPlcMachineId] = useState<string | null>(null);
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'expired'>('pending');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<OrderQRCodeHandle>(null);
  const paymentPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Load PLC machine ID and subscribe to realtime balance updates
  useEffect(() => {
    let channel: any;
    const setup = async () => {
      try {
        const plcConfig = await fetchPLCConfig();
        // Use first machine's ID (multi-machine support)
        const machineId = plcConfig.machines?.[0]?.machineId || plcConfig.machineId || 'machine-01';
        setPlcMachineId(machineId);

        // Subscribe to realtime changes on plc_sessions for this machine
        channel = supabase
          .channel(`plc-session-${machineId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'plc_sessions',
              filter: `machine_id=eq.${machineId}`,
            },
            (payload: any) => {
              const newBalance = payload.new?.balance;
              if (typeof newBalance === 'number') {
                setCashBalance(prev => {
                  if (newBalance !== prev) {
                    setBalanceBump(true);
                    setLastInserted(newBalance - prev > 0 ? newBalance - prev : null);
                  }
                  return newBalance;
                });
              }
            }
          )
          .subscribe();

        // Also fetch current session balance
        const { data } = await supabase
          .from('plc_sessions')
          .select('balance')
          .eq('machine_id', machineId)
          .eq('status', 'active')
          .single();
        if (data) {
          setCashBalance(data.balance);
        }
      } catch (err) {
        console.log('PLC config load error:', err);
      }
    };
    setup();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const { robotCategories, staffCategories } = useCategories();
  const categories = menuType === 'robot' ? robotCategories : staffCategories;
  const items = (menuType === 'robot' ? robotItems : staffItems).filter(i => i.cat === activeCategory);

  useEffect(() => {
    setActiveCategory(categories[0]?.id || '');
  }, [menuType]);

  const sendToPLC = async (orderNum: string) => {
    try {
      const response = await supabase.functions.invoke('send-to-plc', {
        body: {
          orderNumber: orderNum,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            qty: item.qty,
            cat: item.cat,
          })),
          total: cartTotal,
          payment,
        },
      });

      const { toast } = await import('sonner');
      if (response.data?.success) {
        toast.success(
          language === 'ku' ? `✅ ئۆردەر #${orderNum} بۆ PLC نێردرا` :
          language === 'ar' ? `✅ تم إرسال الطلب #${orderNum} إلى PLC` :
          `✅ Order #${orderNum} sent to PLC`
        );
      } else {
        console.log('PLC response:', response.data?.message);
        // Don't show error toast if auto-send is just disabled
        if (response.data?.message !== 'Auto-send is disabled in PLC settings') {
          toast.warning(
            language === 'ku' ? `⚠️ PLC: ${response.data?.message}` :
            language === 'ar' ? `⚠️ PLC: ${response.data?.message}` :
            `⚠️ PLC: ${response.data?.message}`
          );
        }
      }
    } catch (err) {
      console.error('PLC send error:', err);
    }
  };

  // Cleanup payment polling on unmount
  useEffect(() => {
    return () => {
      if (paymentPollRef.current) clearInterval(paymentPollRef.current);
    };
  }, []);

  const startPaymentPolling = (pId: string) => {
    if (paymentPollRef.current) clearInterval(paymentPollRef.current);
    let attempts = 0;
    const maxAttempts = 120; // 5 min (every 2.5s)

    paymentPollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (paymentPollRef.current) clearInterval(paymentPollRef.current);
        setPaymentStatus('expired');
        return;
      }

      try {
        const resp = await supabase.functions.invoke('check-payment', {
          body: { paymentId: pId },
        });

        if (resp.data?.status === 'paid') {
          if (paymentPollRef.current) clearInterval(paymentPollRef.current);
          setPaymentStatus('paid');
          // Show success modal
          setTimeout(() => {
            setShowPaymentModal(false);
            setShowModal(true);
          }, 1500);
        } else if (resp.data?.status === 'failed' || resp.data?.status === 'cancelled') {
          if (paymentPollRef.current) clearInterval(paymentPollRef.current);
          setPaymentStatus('failed');
        }
      } catch (err) {
        console.error('Payment poll error:', err);
      }
    }, 2500);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    const isOnlinePayment = payment !== 'cash' && payment !== 'plc';

    // For online payments, first check if configured
    if (isOnlinePayment) {
      if (!(await isPaymentConfigured(payment))) {
        const { toast } = await import('sonner');
        toast.error(t.paymentNotConfigured);
        return;
      }

      // Create payment first, then order after payment confirmed
      setPaymentLoading(true);
      const currentCart = [...cart];
      const currentTotal = cartTotal;

      try {
        // Create a pending order first
        const { getNextDailyOrderNumber } = await import('@/utils/orderCounter');
        const orderNum = getNextDailyOrderNumber();

        await supabase.from('orders').insert({
          order_number: orderNum,
          items: currentCart as any,
          total: currentTotal,
          payment,
          order_type: orderType,
          lang: language,
          status: 'pending_payment',
          is_online: false,
        });

        // Create payment
        const resp = await supabase.functions.invoke('create-payment', {
          body: {
            provider: payment,
            amount: currentTotal,
            orderNumber: orderNum,
            lang: language,
          },
        });

        setPaymentLoading(false);

        if (resp.data?.success) {
          setLastOrderNum(orderNum);
          setPaymentData(resp.data);
          setPaymentStatus('pending');
          setShowPaymentModal(true);
          clearCart();

          // Start polling for payment status
          startPaymentPolling(resp.data.paymentId);
        } else {
          const { toast } = await import('sonner');
          toast.error(resp.data?.error || 'Payment creation failed');

          // Remove the pending order
          await supabase.from('orders').delete().eq('order_number', orderNum).eq('status', 'pending_payment');
        }
      } catch (err: any) {
        setPaymentLoading(false);
        const { toast } = await import('sonner');
        toast.error(err.message || 'Payment error');
      }
      return;
    }

    // Regular cash/PLC flow (online payments handled above)

    // Store current cart info before placing order (cart gets cleared)
    const isRobotOrder = menuType === 'robot';
    const currentCart = [...cart];
    const currentTotal = cartTotal;

    const num = await placeOrder(payment, orderType);
    setLastOrderNum(num);
    setShowModal(true);

    // Auto-send to PLC for robot orders
    if (isRobotOrder) {
      try {
        await supabase.functions.invoke('send-to-plc', {
          body: {
            orderNumber: num,
            items: currentCart.map(item => ({
              id: item.id,
              name: item.name,
              qty: item.qty,
              cat: item.cat,
            })),
            total: currentTotal,
            payment,
          },
        });
        const { toast } = await import('sonner');
        toast.success(
          language === 'ku' ? `🤖 ئۆردەر #${num} بۆ سیستەمی PLC نێردرا` :
          language === 'ar' ? `🤖 تم إرسال الطلب #${num} إلى نظام PLC` :
          `🤖 Order #${num} sent to PLC system`
        );
      } catch (err) {
        console.error('PLC auto-send error:', err);
      }
    }
  };

  const cancelPayment = async () => {
    if (paymentPollRef.current) clearInterval(paymentPollRef.current);
    // Delete the pending order
    if (lastOrderNum) {
      await supabase.from('orders').delete().eq('order_number', lastOrderNum).eq('status', 'pending_payment');
    }
    setShowPaymentModal(false);
    setPaymentData(null);
    setPaymentStatus('pending');
  };

  // QR is now handled by OrderQRCode component

  const [cafeName, setCafeName] = useState('PLC');

  useEffect(() => {
    fetchCafeConfig().then(cfg => setCafeName(cfg.name));
  }, []);

  const doPrint = (orderNum: string) => {
    const qrDataUrl = qrRef.current?.getDataUrl() || '';
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

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ plc: true, fib: true, zain: true, fastpay: true });
  const [paymentLogos, setPaymentLogos] = useState<PaymentLogos>({});

  useEffect(() => {
    fetchPaymentConfig().then(setPaymentConfig);
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

  return (
    <div className="flex flex-col w-full h-screen bg-background overflow-hidden relative" dir={direction}>
      {/* Decorative geometric shapes */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: FROOZT_COLORS.banana }} />
      <div className="absolute bottom-[-80px] left-[-80px] w-[250px] h-[250px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: FROOZT_COLORS.ice }} />
      <div className="absolute top-[40%] right-[5%] w-[60px] h-[60px] rounded-2xl rotate-12 opacity-[0.03] pointer-events-none" style={{ background: FROOZT_COLORS.pink }} />

      {/* Top Bar */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Coffee className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <span className="text-foreground text-sm sm:text-base font-black tracking-tight uppercase">{cafeName}</span>
            <div className="flex items-center gap-1.5">
              <div className="h-[1px] w-3 bg-primary/40" />
              <span className="text-primary text-[8px] sm:text-[9px] font-bold tracking-[0.2em] uppercase">Robotic Café</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-1.5 bg-card border border-border text-muted-foreground px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-semibold cursor-pointer hover:border-primary/40 hover:text-primary transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.backToHome || 'Home'}</span>
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-foreground text-lg font-bold tabular-nums">{clock}</div>
            <div className="text-muted-foreground text-[10px]">{dateStr}</div>
          </div>
          <button onClick={() => navigate('/')} className="hidden md:flex items-center gap-1.5 bg-card border border-border text-muted-foreground px-3 py-1.5 rounded-xl text-xs cursor-pointer hover:text-foreground hover:border-primary/30 transition-all">
            <Globe className="w-3.5 h-3.5" />
            {t.changeLang}
          </button>
          {/* Mobile cart toggle */}
          <button
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="lg:hidden relative flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-2.5 py-2 rounded-xl text-xs font-semibold"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: FROOZT_COLORS.banana, color: '#1a1a1a' }}>{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Menu Type Tabs - Froozt style with accent colors */}
      <div className="flex bg-card/60 backdrop-blur-sm border-b border-border shrink-0 relative z-10">
        <button
          onClick={() => setMenuType('robot')}
          className={`flex-1 py-3 sm:py-4 text-center cursor-pointer transition-all border-b-3 flex items-center justify-center gap-2 sm:gap-3 ${menuType === 'robot' ? 'border-b-[3px]' : 'border-b-[3px] border-transparent hover:bg-secondary/50'}`}
          style={menuType === 'robot' ? { borderBottomColor: FROOZT_COLORS.ice } : {}}
        >
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all"
            style={menuType === 'robot' ? { background: `${FROOZT_COLORS.ice}20`, color: FROOZT_COLORS.ice } : {}}
          >
            <Bot className={`w-4 h-4 sm:w-5 sm:h-5 ${menuType !== 'robot' ? 'text-muted-foreground' : ''}`} />
          </div>
          <div className="text-left">
            <div className={`text-xs sm:text-sm font-bold ${menuType === 'robot' ? '' : 'text-muted-foreground'}`} style={menuType === 'robot' ? { color: FROOZT_COLORS.ice } : {}}>{t.tabRobot}</div>
            <div className="text-[9px] sm:text-[11px] text-muted-foreground hidden sm:block">{t.tabRobotSub}</div>
          </div>
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => setMenuType('staff')}
          className={`flex-1 py-3 sm:py-4 text-center cursor-pointer transition-all flex items-center justify-center gap-2 sm:gap-3 ${menuType === 'staff' ? 'border-b-[3px]' : 'border-b-[3px] border-transparent hover:bg-secondary/50'}`}
          style={menuType === 'staff' ? { borderBottomColor: FROOZT_COLORS.pink } : {}}
        >
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all"
            style={menuType === 'staff' ? { background: `${FROOZT_COLORS.pink}20`, color: FROOZT_COLORS.pink } : {}}
          >
            <ChefHat className={`w-4 h-4 sm:w-5 sm:h-5 ${menuType !== 'staff' ? 'text-muted-foreground' : ''}`} />
          </div>
          <div className="text-left">
            <div className={`text-xs sm:text-sm font-bold ${menuType === 'staff' ? '' : 'text-muted-foreground'}`} style={menuType === 'staff' ? { color: FROOZT_COLORS.pink } : {}}>{t.tabStaff}</div>
            <div className="text-[9px] sm:text-[11px] text-muted-foreground hidden sm:block">{t.tabStaffSub}</div>
          </div>
        </button>
      </div>

      {/* Mobile Categories (horizontal scroll) */}
      <div className="md:hidden flex gap-2 overflow-x-auto px-3 py-2.5 bg-card/40 backdrop-blur-sm border-b border-border shrink-0 relative z-10">
        {categories.map((cat, i) => {
          const isActive = activeCategory === cat.id;
          const accentColor = [FROOZT_COLORS.banana, FROOZT_COLORS.ice, FROOZT_COLORS.pink, FROOZT_COLORS.lilac][i % 4];
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap text-xs font-bold border transition-all ${
                isActive ? 'border-transparent shadow-md' : 'border-border bg-card text-muted-foreground'
              }`}
              style={isActive ? { background: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}40` } : {}}
            >
              {cat.image ? (
                <img src={cat.image} alt="" className="w-4 h-4 rounded object-cover" />
              ) : (
                <span className="text-sm">{cat.icon}</span>
              )}
              {cat.name[language]}
            </button>
          );
        })}
      </div>

      {/* Menu Body */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Categories Sidebar - hidden on mobile */}
        <div className="hidden md:block w-48 bg-card/60 backdrop-blur-sm border-r border-border overflow-y-auto shrink-0 py-3">
          {categories.map((cat, i) => {
            const isActive = activeCategory === cat.id;
            const accentColor = [FROOZT_COLORS.banana, FROOZT_COLORS.ice, FROOZT_COLORS.pink, FROOZT_COLORS.lilac][i % 4];
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full py-3 px-4 cursor-pointer text-left transition-all flex items-center gap-3 rounded-none ${
                  isActive
                    ? 'border-l-[3px] font-bold'
                    : 'border-l-[3px] border-l-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
                style={isActive ? { borderLeftColor: accentColor, color: accentColor, background: `${accentColor}08` } : {}}
              >
                {cat.image ? (
                  <img src={cat.image} alt="" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <span className="text-lg">{cat.icon}</span>
                )}
                <span className="text-sm">{cat.name[language]}</span>
              </button>
            );
          })}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2 sm:gap-3 lg:gap-4 content-start">
          {items.map((item, i) => {
            const accentColor = [FROOZT_COLORS.banana, FROOZT_COLORS.ice, FROOZT_COLORS.pink, FROOZT_COLORS.lilac][i % 4];
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="group bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all text-left hover:shadow-xl animate-fade-up flex flex-col"
                style={{ '--hover-accent': accentColor } as any}
              >
                <div className="relative overflow-hidden aspect-[5/4] sm:aspect-[4/3] lg:aspect-[4/3]">
                  {menuImages[item.id] ? (
                    <img src={menuImages[item.id]} alt={item.name[language]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : item.image ? (
                    <img src={item.image} alt={item.name[language]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl opacity-40">{item.emoji}</span>
                    </div>
                  )}
                  {/* Froozt-style accent stripe on hover */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 opacity-0 group-hover:opacity-100"
                    style={{ background: accentColor }}
                  />
                </div>
                <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
                  <div className="text-foreground text-xs sm:text-sm font-bold mb-0.5 truncate">{item.name[language]}</div>
                  <div className="text-muted-foreground text-[9px] sm:text-[11px] mb-1.5 sm:mb-2 line-clamp-1 sm:line-clamp-2">{item.desc[language]}</div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-primary text-sm sm:text-base font-black">{item.price.toLocaleString()} <span className="text-[9px] sm:text-xs font-normal text-primary/60">IQD</span></div>
                    <div
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75"
                      style={{ background: `${accentColor}30`, color: accentColor }}
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Order Panel */}
        {showMobileCart && <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowMobileCart(false)} />}
        <div className={`${showMobileCart ? 'fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[360px] shadow-2xl' : 'hidden'} lg:relative lg:block lg:w-80 bg-card border-l border-border flex flex-col shrink-0`}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-foreground text-sm font-black tracking-tight">{t.orderTitle}</div>
              <div className="text-muted-foreground text-[10px] font-medium">{cartItemCount} {t.items}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${FROOZT_COLORS.banana}15` }}>
                <ShoppingCart className="w-4 h-4" style={{ color: FROOZT_COLORS.banana }} />
              </div>
              <button onClick={() => setShowMobileCart(false)} className="lg:hidden w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <div className="text-sm font-medium">{t.emptyCart}</div>
              </div>
            ) : (
              cart.map((item, i) => {
                const accentColor = [FROOZT_COLORS.banana, FROOZT_COLORS.ice, FROOZT_COLORS.pink, FROOZT_COLORS.lilac][i % 4];
                return (
                  <div key={item.id} className="bg-secondary/80 rounded-xl p-3 mb-2 flex items-center gap-2.5 animate-slide-in border border-border/50">
                    {menuImages[item.id] ? (
                      <img src={menuImages[item.id]} alt="" className="w-11 h-11 rounded-xl object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-lg">{item.emoji}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-xs font-bold truncate">{item.name[language]}</div>
                      <div className="text-primary text-xs font-semibold">{(item.price * item.qty).toLocaleString()} IQD</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); changeQty(item.id, -1); }} className="w-6 h-6 border border-border bg-card text-foreground rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-foreground text-xs font-black min-w-[18px] text-center">{item.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); changeQty(item.id, 1); }} className="w-6 h-6 border border-border bg-card text-foreground rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-border bg-card">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground text-xs">{t.subtotal}</span>
              <span className="text-foreground text-xs font-medium">{cartTotal.toLocaleString()} IQD</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border mt-2 mb-4">
              <span className="text-foreground text-base font-black">{t.total}</span>
              <span className="text-base font-black" style={{ color: FROOZT_COLORS.banana }}>{cartTotal.toLocaleString()} IQD</span>
            </div>

            {/* === CASH PAYMENT SECTION === */}
            <div className="mb-3">
              <div className="text-muted-foreground text-[10px] uppercase tracking-[0.15em] mb-2 font-bold flex items-center gap-1.5">
                <Banknote className="w-3 h-3" />
                {language === 'ku' ? 'پارەدانی کاش' : language === 'ar' ? 'الدفع النقدي' : 'Cash Payment'}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <button
                  onClick={() => { setPayment('cash'); setCashBalance(0); setLastInserted(null); }}
                  className={`flex items-center gap-1.5 p-2.5 border rounded-xl cursor-pointer text-[11px] font-bold transition-all ${
                    payment === 'cash'
                      ? 'border-transparent shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                  style={payment === 'cash' ? { background: `${FROOZT_COLORS.ice}15`, color: FROOZT_COLORS.ice, borderColor: `${FROOZT_COLORS.ice}40` } : {}}
                >
                  <Banknote className="w-4 h-4" />
                  {language === 'ku' ? 'کاش بەدەست' : language === 'ar' ? 'نقد يدوي' : 'Manual Cash'}
                </button>
                {paymentConfig.plc !== false && (
                  <button
                    onClick={() => { setPayment('plc'); }}
                    className={`flex items-center gap-1.5 p-2.5 border rounded-xl cursor-pointer text-[11px] font-bold transition-all ${
                      payment === 'plc'
                        ? 'border-transparent shadow-sm'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                    style={payment === 'plc' ? { background: `${FROOZT_COLORS.lilac}15`, color: FROOZT_COLORS.lilac, borderColor: `${FROOZT_COLORS.lilac}40` } : {}}
                  >
                    <Coins className="w-4 h-4" />
                    {language === 'ku' ? 'کاش بە PLC' : language === 'ar' ? 'نقد PLC' : 'PLC Cash'}
                  </button>
                )}
              </div>

              {/* PLC Vending Machine UI */}
              {payment === 'plc' && (
                <div className="rounded-xl border border-border p-3 mt-1" style={{ background: `${FROOZT_COLORS.lilac}05` }}>
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
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-0.5 font-bold">
                      {language === 'ku' ? 'باڵانس' : language === 'ar' ? 'الرصيد' : 'Balance'}
                    </div>
                    <div className={`text-2xl font-black tabular-nums transition-all duration-300 ${balanceBump ? 'animate-balance-bump' : ''} ${
                      cashBalance >= cartTotal && cartTotal > 0 ? 'text-success' : cashBalance > 0 ? 'text-warning' : 'text-muted-foreground'
                    }`} onAnimationEnd={() => setBalanceBump(false)}>
                      {cashBalance.toLocaleString()} <span className="text-xs font-normal opacity-60">IQD</span>
                    </div>
                    {cartTotal > 0 && cashBalance < cartTotal && (
                      <div className="text-[10px] text-destructive mt-1 font-bold">
                        {language === 'ku' ? `${(cartTotal - cashBalance).toLocaleString()} IQD پێویستە` : 
                         language === 'ar' ? `مطلوب ${(cartTotal - cashBalance).toLocaleString()} IQD` :
                         `${(cartTotal - cashBalance).toLocaleString()} IQD needed`}
                      </div>
                    )}
                    {cartTotal > 0 && cashBalance >= cartTotal && cashBalance - cartTotal > 0 && (
                      <div className="text-[10px] text-success mt-1 font-bold">
                        {language === 'ku' ? `گەڕانەوە: ${(cashBalance - cartTotal).toLocaleString()} IQD` :
                         language === 'ar' ? `الباقي: ${(cashBalance - cartTotal).toLocaleString()} IQD` :
                         `Change: ${(cashBalance - cartTotal).toLocaleString()} IQD`}
                      </div>
                    )}
                  </div>

                  {/* Waiting for machine cash insert */}
                  <div className="text-center py-3">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'ku' ? 'چاوەڕوانی داخڵکردنی پارە لە ئامێرەکە...' : 
                       language === 'ar' ? 'في انتظار إدخال النقد من الجهاز...' :
                       'Waiting for cash from machine...'}
                    </div>
                  </div>

                  {cashBalance > 0 && (
                    <button
                      onClick={async () => {
                        setCashBalance(0); setLastInserted(null);
                        try {
                          await supabase.functions.invoke('plc-cash-insert', {
                            body: { machine_id: plcMachineId || 'machine-01', action: 'reset' },
                          });
                        } catch {}
                      }}
                      className="w-full mt-2 text-[10px] text-destructive hover:text-destructive/80 transition-colors font-bold"
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
                <div className="text-muted-foreground text-[10px] uppercase tracking-[0.15em] mb-2 font-bold flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  {language === 'ku' ? 'پارەدانی ئۆنلاین' : language === 'ar' ? 'الدفع الإلكتروني' : 'Online Payment'}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {onlinePaymentMethods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setPayment(m.id); setCashBalance(0); }}
                      className={`flex items-center gap-1.5 p-2 border rounded-xl cursor-pointer text-[11px] font-bold transition-all ${
                        payment === m.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
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
              <div className="text-muted-foreground text-[10px] uppercase tracking-[0.15em] mb-2 font-bold">{t.orderType}</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setOrderType('dine')}
                  className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-[11px] font-bold transition-all ${
                    orderType === 'dine'
                      ? 'border-transparent shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                  style={orderType === 'dine' ? { background: `${FROOZT_COLORS.pink}15`, color: FROOZT_COLORS.pink, borderColor: `${FROOZT_COLORS.pink}40` } : {}}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  {t.dineIn}
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-[11px] font-bold transition-all ${
                    orderType === 'delivery'
                      ? 'border-transparent shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                  style={orderType === 'delivery' ? { background: `${FROOZT_COLORS.ice}15`, color: FROOZT_COLORS.ice, borderColor: `${FROOZT_COLORS.ice}40` } : {}}
                >
                  <Truck className="w-3.5 h-3.5" />
                  {t.delivery}
                </button>
              </div>
            </div>

            <button
              onClick={async () => {
                handlePlaceOrder();
                setCashBalance(0);
                if (payment === 'plc') {
                  try {
                    await supabase.functions.invoke('plc-cash-insert', {
                      body: { machine_id: plcMachineId || 'machine-01', action: 'reset' },
                    });
                  } catch {}
                }
              }}
              disabled={cart.length === 0 || (payment === 'plc' && cashBalance < cartTotal) || paymentLoading}
              className="w-full py-3.5 rounded-xl text-sm font-black cursor-pointer transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
              style={{ background: FROOZT_COLORS.banana, color: '#1a1a1a' }}
            >
              {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {paymentLoading ? (language === 'ku' ? 'چاوەڕوان بە...' : language === 'ar' ? 'يرجى الانتظار...' : 'Processing...') : t.placeOrder}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Pending Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-card border border-border rounded-3xl p-5 sm:p-8 w-full max-w-[480px] text-center animate-modal-in relative overflow-hidden">
            <div className="absolute top-[-30px] right-[-30px] w-[100px] h-[100px] rounded-full opacity-[0.08]" style={{ background: FROOZT_COLORS.lilac }} />
            <div className="absolute bottom-[-20px] left-[-20px] w-[80px] h-[80px] rounded-full opacity-[0.08]" style={{ background: FROOZT_COLORS.ice }} />

            {paymentStatus === 'pending' && (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: `${FROOZT_COLORS.lilac}20` }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: FROOZT_COLORS.lilac }} />
                </div>
                <div className="text-foreground text-xl font-black mb-1">{t.paymentPending}</div>
                <div className="text-muted-foreground text-sm mb-6">{t.paymentPendingDesc}</div>

                <div className="bg-secondary border border-border rounded-2xl py-4 px-8 mb-5 inline-block">
                  <div className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-1 font-bold">{t.orderNumLabel}</div>
                  <div className="text-3xl font-black" style={{ color: FROOZT_COLORS.banana }}>#{lastOrderNum}</div>
                  <div className="text-primary text-sm font-bold mt-1">{cartTotal.toLocaleString() || paymentData?.amount?.toLocaleString()} IQD</div>
                </div>

                {/* QR Code from provider */}
                {paymentData?.qrCode && (
                  <div className="mb-4">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 font-bold flex items-center justify-center gap-1">
                      <QrCode className="w-3 h-3" />
                      {t.paymentScanQR}
                    </div>
                    <div className="bg-white rounded-2xl p-4 inline-block border border-border">
                      <img src={paymentData.qrCode} alt="Payment QR" className="w-48 h-48 mx-auto" />
                    </div>
                  </div>
                )}

                {/* Payment Link */}
                {paymentData?.paymentLink && (
                  <div className="mb-4">
                    <a
                      href={paymentData.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 border border-primary/30"
                      style={{ background: `${FROOZT_COLORS.ice}15`, color: FROOZT_COLORS.ice }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t.paymentOpenLink}
                    </a>
                  </div>
                )}

                {paymentData?.readableCode && (
                  <div className="mb-4 bg-secondary rounded-xl p-3 border border-border">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1 font-bold">
                      {language === 'ku' ? 'کۆدی پارەدان' : language === 'ar' ? 'رمز الدفع' : 'Payment Code'}
                    </div>
                    <div className="text-foreground text-2xl font-black tracking-widest">{paymentData.readableCode}</div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t.paymentWaiting}
                </div>

                <button
                  onClick={cancelPayment}
                  className="px-6 py-3 rounded-xl bg-secondary text-foreground border border-border font-bold text-sm cursor-pointer transition-all hover:bg-muted"
                >
                  {t.paymentCancel}
                </button>
              </>
            )}

            {paymentStatus === 'paid' && (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-success/20">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <div className="text-foreground text-xl font-black mb-1">{t.paymentSuccess}</div>
                <div className="text-success text-sm font-bold">{t.modalSub}</div>
              </>
            )}

            {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-destructive/20">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-foreground text-xl font-black mb-1">
                  {paymentStatus === 'expired' ? t.paymentExpired : t.paymentFailed}
                </div>
                <button
                  onClick={() => { setShowPaymentModal(false); setPaymentData(null); }}
                  className="mt-5 px-6 py-3 rounded-xl font-black text-sm cursor-pointer transition-all hover:opacity-90 uppercase tracking-wider"
                  style={{ background: FROOZT_COLORS.banana, color: '#1a1a1a' }}
                >
                  {t.modalOk}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-card border border-border rounded-3xl p-5 sm:p-8 w-full max-w-[480px] text-center animate-modal-in relative overflow-hidden">
            <div className="absolute top-[-30px] right-[-30px] w-[100px] h-[100px] rounded-full opacity-[0.08]" style={{ background: FROOZT_COLORS.banana }} />
            <div className="absolute bottom-[-20px] left-[-20px] w-[80px] h-[80px] rounded-full opacity-[0.08]" style={{ background: FROOZT_COLORS.ice }} />
            
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: `${FROOZT_COLORS.ice}20` }}>
              <Check className="w-8 h-8" style={{ color: FROOZT_COLORS.ice }} />
            </div>
            <div className="text-foreground text-xl font-black mb-1">{t.modalTitle}</div>
            <div className="text-muted-foreground text-sm mb-6">{t.modalSub}</div>
            <div className="bg-secondary border border-border rounded-2xl py-4 px-8 mb-5 inline-block">
              <div className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-1 font-bold">{t.orderNumLabel}</div>
              <div className="text-4xl font-black" style={{ color: FROOZT_COLORS.banana }}>#{lastOrderNum}</div>
            </div>
            <div className="mb-5">
              <OrderQRCode ref={qrRef} orderNumber={lastOrderNum} cafeName={cafeName} />
            </div>
            <div className="text-muted-foreground text-xs mb-5">{t.qrHint}</div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-black text-sm cursor-pointer transition-all hover:opacity-90 uppercase tracking-wider" style={{ background: FROOZT_COLORS.banana, color: '#1a1a1a' }}>
                {t.modalOk}
              </button>
              <button onClick={printLabel} className="px-6 py-3 rounded-xl bg-secondary text-foreground border border-border font-bold text-sm cursor-pointer transition-all hover:bg-muted flex items-center gap-2">
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
