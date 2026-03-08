import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Zap, Building2, Save, ToggleLeft, ToggleRight, Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentConfig {
  plc: boolean;
  fib: boolean;
  zain: boolean;
  fastpay: boolean;
}

export interface PaymentKeys {
  [providerId: string]: Record<number, string>;
}

// Cache
let cachedPaymentConfig: PaymentConfig | null = null;
let cachedPaymentKeys: PaymentKeys | null = null;

export const fetchPaymentConfig = async (): Promise<PaymentConfig> => {
  if (cachedPaymentConfig) return cachedPaymentConfig;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'payment_config')
    .single();
  cachedPaymentConfig = (data?.value as any) || { plc: true, fib: true, zain: true, fastpay: true };
  return cachedPaymentConfig!;
};

export const fetchPaymentKeys = async (): Promise<PaymentKeys> => {
  if (cachedPaymentKeys) return cachedPaymentKeys;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'payment_keys')
    .single();
  cachedPaymentKeys = (data?.value as any) || {};
  return cachedPaymentKeys!;
};

export const invalidatePaymentCache = () => {
  cachedPaymentConfig = null;
  cachedPaymentKeys = null;
};

// Check if a payment provider has API keys configured
export const isPaymentConfigured = async (providerId: string): Promise<boolean> => {
  if (providerId === 'cash' || providerId === 'plc') return true;
  const keys = await fetchPaymentKeys();
  const providerKeys = keys[providerId];
  if (!providerKeys) return false;
  return Object.values(providerKeys).some((v: any) => v && String(v).trim().length > 0);
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
  const [config, setConfig] = useState<PaymentConfig>({ plc: true, fib: true, zain: true, fastpay: true });
  const [fieldValues, setFieldValues] = useState<PaymentKeys>({});
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('plc_admin_lang') as 'ku' | 'ar' | 'en' | null;
    if (savedLang) setLang(savedLang);

    const load = async () => {
      const [cfg, keys] = await Promise.all([fetchPaymentConfig(), fetchPaymentKeys()]);
      setConfig(cfg);
      setFieldValues(keys);
      setLoading(false);
    };
    load();
  }, []);

  const toggleProvider = async (id: keyof PaymentConfig) => {
    const updated = { ...config, [id]: !config[id] };
    setConfig(updated);
    
    const { error } = await supabase
      .from('app_settings')
      .update({ value: updated as any, updated_at: new Date().toISOString() })
      .eq('key', 'payment_config');

    if (error) {
      toast.error(error.message);
      setConfig(config); // revert
      return;
    }

    invalidatePaymentCache();
    toast.success(
      lang === 'ku' ? `${id.toUpperCase()} ${updated[id] ? 'چالاک کرا' : 'ناچالاک کرا'}` :
      lang === 'ar' ? `${id.toUpperCase()} ${updated[id] ? 'تم التفعيل' : 'تم التعطيل'}` :
      `${id.toUpperCase()} ${updated[id] ? 'enabled' : 'disabled'}`
    );
  };

  const updateFieldValue = (providerId: string, fieldIndex: number, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId], [fieldIndex]: value }
    }));
  };

  const saveProviderKeys = async (providerId: string) => {
    setSavingKeys(providerId);
    const updatedKeys = { ...fieldValues };

    const { error } = await supabase
      .from('app_settings')
      .update({ value: updatedKeys as any, updated_at: new Date().toISOString() })
      .eq('key', 'payment_keys');

    setSavingKeys(null);
    if (error) {
      toast.error(error.message);
      return;
    }

    invalidatePaymentCache();
    toast.success(
      lang === 'ku' ? `${providerId.toUpperCase()} پاشکەوت کرا ✓` :
      lang === 'ar' ? `تم حفظ ${providerId.toUpperCase()} ✓` :
      `${providerId.toUpperCase()} saved ✓`
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div dir={direction}>
      <h2 className="text-foreground text-lg font-bold mb-6 flex items-center gap-2">
        {labels.title[lang]}
      </h2>

      <div className="flex gap-2 mb-6">
        {(['ku', 'ar', 'en'] as const).map(l => (
          <button key={l} onClick={() => { setLang(l); localStorage.setItem('plc_admin_lang', l); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${lang === l ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
            {l === 'ku' ? 'کوردی' : l === 'ar' ? 'العربية' : 'English'}
          </button>
        ))}
      </div>

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

      <div className="mb-4">
        <h3 className="text-foreground text-base font-bold mb-1 flex items-center gap-2">
          {labels.onlineTitle[lang]}
        </h3>
        <p className="text-muted-foreground text-xs mb-4">{labels.onlineDesc[lang]}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

              {'description' in p && p.description && (
                <div className="text-muted-foreground text-xs mb-3 bg-secondary/50 rounded-lg p-3 border border-border">
                  {(p as any).description[lang]}
                </div>
              )}

              {p.fields.map((f, i) => (
                <div key={i} className="mb-3">
                  <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1.5 font-semibold">{f.label[lang]}</div>
                  <input
                    className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    type={f.type} placeholder={f.placeholder}
                    disabled={!enabled}
                    value={fieldValues[p.id]?.[i] || ''}
                    onChange={e => updateFieldValue(p.id, i, e.target.value)}
                  />
                </div>
              ))}
              {p.fields.length > 0 && (
                <button
                  disabled={!enabled || savingKeys === p.id}
                  onClick={() => saveProviderKeys(p.id)}
                  className="w-full mt-2 p-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingKeys === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {labels.save[lang]}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPayments;
