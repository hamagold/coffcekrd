import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Zap, Building2, Save, ToggleLeft, ToggleRight, Coins } from 'lucide-react';
import { toast } from 'sonner';

export interface PaymentConfig {
  plc: boolean;
  fib: boolean;
  zain: boolean;
  fastpay: boolean;
}

export const getPaymentConfig = (): PaymentConfig => {
  try {
    const saved = localStorage.getItem('plc_payment_config');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { plc: true, fib: true, zain: true, fastpay: true };
};

const providers = [
  {
    id: 'plc' as const,
    name: { ku: 'PLC سیستەم', ar: 'نظام PLC', en: 'PLC System' },
    icon: Coins,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    fields: [],
    description: { ku: 'سیستەمی وەرگرتنی کاش بە ئامێری PLC (وێندینگ مەشین)', ar: 'نظام استلام النقود عبر جهاز PLC', en: 'PLC vending machine cash acceptor system' },
  },
  {
    id: 'fib' as const,
    name: { ku: 'بانکی FIB', ar: 'بنك FIB', en: 'FIB Bank' },
    icon: Building2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    fields: [
      { label: { ku: 'کلیلی API', ar: 'مفتاح API', en: 'API KEY' }, type: 'password', placeholder: 'fib_live_xxxx' },
      { label: { ku: 'ناسنامەی بازرگان', ar: 'معرف التاجر', en: 'MERCHANT ID' }, type: 'text', placeholder: 'FIB-MERCHANT-ID' },
    ],
  },
  {
    id: 'zain' as const,
    name: { ku: 'زەین کاش', ar: 'زين كاش', en: 'ZainCash' },
    icon: Smartphone,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    fields: [
      { label: { ku: 'تۆکنی بازرگان', ar: 'رمز التاجر', en: 'MERCHANT TOKEN' }, type: 'password', placeholder: 'zain_token_xxxx' },
      { label: { ku: 'ژمارەی مۆبایل', ar: 'رقم الهاتف', en: 'MSISDN (Phone)' }, type: 'text', placeholder: '07801234567' },
      { label: { ku: 'کلیلی نهێنی', ar: 'المفتاح السري', en: 'SECRET KEY' }, type: 'password', placeholder: 'secret_xxxx' },
    ],
  },
  {
    id: 'fastpay' as const,
    name: { ku: 'فاست پەی', ar: 'فاست باي', en: 'FastPay' },
    icon: Zap,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    fields: [
      { label: { ku: 'کلیلی API', ar: 'مفتاح API', en: 'API KEY' }, type: 'password', placeholder: 'fp_live_xxxx' },
      { label: { ku: 'ناسنامەی جزدان', ar: 'معرف المحفظة', en: 'WALLET ID' }, type: 'text', placeholder: 'FP-WALLET-XXXXX' },
      { label: { ku: 'نهێنی Webhook', ar: 'سر Webhook', en: 'WEBHOOK SECRET' }, type: 'password', placeholder: 'whsec_xxxx' },
    ],
  },
];

const AdminPayments = () => {
  const [lang, setLang] = useState<'ku' | 'ar' | 'en'>('ku');
  const [config, setConfig] = useState<PaymentConfig>(getPaymentConfig);

  useEffect(() => {
    const savedLang = localStorage.getItem('plc_admin_lang') as 'ku' | 'ar' | 'en' | null;
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleProvider = (id: keyof PaymentConfig) => {
    setConfig(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('plc_payment_config', JSON.stringify(updated));
      toast.success(
        lang === 'ku' ? `${id.toUpperCase()} ${updated[id] ? 'چالاک کرا' : 'ناچالاک کرا'}` :
        lang === 'ar' ? `${id.toUpperCase()} ${updated[id] ? 'تم التفعيل' : 'تم التعطيل'}` :
        `${id.toUpperCase()} ${updated[id] ? 'enabled' : 'disabled'}`
      );
      return updated;
    });
  };

  const direction = lang === 'en' ? 'ltr' : 'rtl';
  const labels = {
    title: { ku: '💳 ڕێکخستنی پارەدان', ar: '💳 إعدادات الدفع', en: '💳 Payment Settings' },
    cashTitle: { ku: '💵 پارەدانی کاش', ar: '💵 الدفع النقدي', en: '💵 Cash Payment' },
    cashDesc: { ku: 'پارەدانی کاش هەمیشە چالاکە و ناتوانرێت ناچالاک بکرێت', ar: 'الدفع النقدي مفعل دائماً ولا يمكن تعطيله', en: 'Cash payment is always enabled and cannot be disabled' },
    onlineTitle: { ku: '🌐 پارەدانی ئۆنلاین', ar: '🌐 الدفع الإلكتروني', en: '🌐 Online Payments' },
    onlineDesc: { ku: 'شێوازەکانی پارەدانی ئۆنلاین چالاک/ناچالاک بکە', ar: 'تفعيل/تعطيل طرق الدفع الإلكتروني', en: 'Enable/disable online payment methods' },
    active: { ku: 'چالاک', ar: 'مفعل', en: 'Active' },
    inactive: { ku: 'ناچالاک', ar: 'معطل', en: 'Inactive' },
    alwaysOn: { ku: 'هەمیشە چالاک', ar: 'مفعل دائماً', en: 'Always On' },
    save: { ku: 'پاشکەوتکردن', ar: 'حفظ', en: 'Save' },
    showInMenu: { ku: 'نیشاندانی لە مینۆ', ar: 'إظهار في القائمة', en: 'Show in Menu' },
  };

  return (
    <div dir={direction}>
      <h2 className="text-foreground text-lg font-bold mb-6 flex items-center gap-2">
        {labels.title[lang]}
      </h2>

      {/* Language selector for admin */}
      <div className="flex gap-2 mb-6">
        {(['ku', 'ar', 'en'] as const).map(l => (
          <button key={l} onClick={() => { setLang(l); localStorage.setItem('plc_admin_lang', l); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${lang === l ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
            {l === 'ku' ? 'کوردی' : l === 'ar' ? 'العربية' : 'English'}
          </button>
        ))}
      </div>

      {/* Cash Section */}
      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <span className="text-xl">💵</span>
          </div>
          <div className="flex-1">
            <div className="text-foreground font-bold text-sm">{labels.cashTitle[lang]}</div>
            <div className="text-muted-foreground text-xs">{labels.cashDesc[lang]}</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
            {labels.alwaysOn[lang]}
          </span>
        </div>
      </div>

      {/* Online Section */}
      <div className="mb-4">
        <h3 className="text-foreground text-base font-bold mb-1 flex items-center gap-2">
          {labels.onlineTitle[lang]}
        </h3>
        <p className="text-muted-foreground text-xs mb-4">{labels.onlineDesc[lang]}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {providers.map(p => {
          const Icon = p.icon;
          const enabled = config[p.id];
          return (
            <div key={p.id} className={`bg-card rounded-xl border transition-all ${enabled ? 'border-primary/30' : 'border-border opacity-70'} p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${p.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-bold text-sm">{p.name[lang]}</div>
                  <div className={`text-[10px] font-semibold ${enabled ? 'text-success' : 'text-muted-foreground'}`}>
                    ● {enabled ? labels.active[lang] : labels.inactive[lang]}
                  </div>
                </div>
                <button onClick={() => toggleProvider(p.id)} className="transition-all" title={labels.showInMenu[lang]}>
                  {enabled
                    ? <ToggleRight className="w-8 h-8 text-success" />
                    : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  }
                </button>
              </div>

              {p.fields.map((f, i) => (
                <div key={i} className="mb-3">
                  <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1.5 font-semibold">{f.label[lang]}</div>
                  <input
                    className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    type={f.type} placeholder={f.placeholder}
                    disabled={!enabled}
                  />
                </div>
              ))}
              <button
                disabled={!enabled}
                className="w-full mt-2 p-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {labels.save[lang]}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPayments;
