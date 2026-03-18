import { useState, useEffect, useRef } from 'react';
import { CreditCard, Smartphone, Zap, Building2, Save, ToggleLeft, ToggleRight, Coins, Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchStorageConfig } from '@/components/settings/StorageSettings';

export interface PaymentConfig {
  cash: boolean;
  plc: boolean;
  fib: boolean;
  zain: boolean;
  fastpay: boolean;
}

export interface PaymentLogos {
  fib?: string;
  zain?: string;
  fastpay?: string;
}

export interface PaymentKeys {
  [providerId: string]: Record<number, string>;
}

// Cache
let cachedPaymentConfig: PaymentConfig | null = null;
let cachedPaymentKeys: PaymentKeys | null = null;
let cachedPaymentLogos: PaymentLogos | null = null;

export const fetchPaymentConfig = async (): Promise<PaymentConfig> => {
  if (cachedPaymentConfig) return cachedPaymentConfig;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'payment_config')
    .single();
  cachedPaymentConfig = (data?.value as any) || { cash: true, plc: true, fib: true, zain: true, fastpay: true };
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

export const fetchPaymentLogos = async (): Promise<PaymentLogos> => {
  if (cachedPaymentLogos) return cachedPaymentLogos;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'payment_logos')
    .single();
  cachedPaymentLogos = (data?.value as any) || {};
  return cachedPaymentLogos!;
};

export const invalidatePaymentCache = () => {
  cachedPaymentConfig = null;
  cachedPaymentKeys = null;
  cachedPaymentLogos = null;
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
    hasLogo: false,
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
    hasLogo: true,
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
    hasLogo: true,
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
    hasLogo: true,
  },
];

const AdminPayments = () => {
  const [lang, setLang] = useState<'ku' | 'ar' | 'en'>('ku');
  const [config, setConfig] = useState<PaymentConfig>({ cash: true, plc: true, fib: true, zain: true, fastpay: true });
  const [fieldValues, setFieldValues] = useState<PaymentKeys>({});
  const [logos, setLogos] = useState<PaymentLogos>({});
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const savedLang = localStorage.getItem('plc_admin_lang') as 'ku' | 'ar' | 'en' | null;
    if (savedLang) setLang(savedLang);

    const load = async () => {
      const [cfg, keys, lgos] = await Promise.all([fetchPaymentConfig(), fetchPaymentKeys(), fetchPaymentLogos()]);
      setConfig(cfg);
      setFieldValues(keys);
      setLogos(lgos);
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
      setConfig(config);
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

  const handleLogoUpload = async (providerId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(lang === 'ku' ? 'تەنها فایلی وێنە قبوڵ دەکرێت' : lang === 'ar' ? 'فقط ملفات الصور مقبولة' : 'Only image files accepted');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(lang === 'ku' ? 'قەبارە دەبێت کەمتر لە 2MB بێت' : lang === 'ar' ? 'الحجم يجب أن يكون أقل من 2MB' : 'Size must be under 2MB');
      return;
    }

    setUploadingLogo(providerId);
    try {
      const storageConfig = await fetchStorageConfig();
      let url: string;

      const ext = file.name.split('.').pop();
      const fileName = `payment-logos/${providerId}_${Date.now()}.${ext}`;

      if (storageConfig.storageType === 'cloudflare-r2') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('accountId', storageConfig.r2Config.accountId);
        formData.append('accessKeyId', storageConfig.r2Config.accessKeyId);
        formData.append('secretAccessKey', storageConfig.r2Config.secretAccessKey);
        formData.append('bucketName', storageConfig.r2Config.bucketName);
        formData.append('publicDomain', storageConfig.r2Config.publicDomain || '');
        formData.append('folder', 'payment-logos');
        const { data, error } = await supabase.functions.invoke('upload-to-r2', { body: formData });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        url = data.url;
      } else {
        const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
        url = data.publicUrl;
      }

      const updatedLogos = { ...logos, [providerId]: url };
      setLogos(updatedLogos);

      // Save to database
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'payment_logos')
        .single();

      if (existing) {
        await supabase
          .from('app_settings')
          .update({ value: updatedLogos as any, updated_at: new Date().toISOString() })
          .eq('key', 'payment_logos');
      } else {
        await supabase
          .from('app_settings')
          .insert({ key: 'payment_logos', value: updatedLogos as any });
      }

      invalidatePaymentCache();
      toast.success(lang === 'ku' ? 'لۆگۆ پاشکەوت کرا ✓' : lang === 'ar' ? 'تم حفظ الشعار ✓' : 'Logo saved ✓');
    } catch (err: any) {
      toast.error(err.message || 'Error uploading logo');
    } finally {
      setUploadingLogo(null);
    }
  };

  const removeLogo = async (providerId: string) => {
    const updatedLogos = { ...logos };
    delete updatedLogos[providerId as keyof PaymentLogos];
    setLogos(updatedLogos);

    await supabase
      .from('app_settings')
      .update({ value: updatedLogos as any, updated_at: new Date().toISOString() })
      .eq('key', 'payment_logos');

    invalidatePaymentCache();
    toast.success(lang === 'ku' ? 'لۆگۆ لابرا' : lang === 'ar' ? 'تم إزالة الشعار' : 'Logo removed');
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
    logo: { ku: 'لۆگۆ', ar: 'الشعار', en: 'Logo' },
    uploadLogo: { ku: 'ئەپلۆدی لۆگۆ', ar: 'رفع الشعار', en: 'Upload Logo' },
    changeLogo: { ku: 'گۆڕینی لۆگۆ', ar: 'تغيير الشعار', en: 'Change Logo' },
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
            <div className="text-muted-foreground text-xs">
              {lang === 'ku' ? 'پارەدانی کاش بەدەست (MANUAL CASH)' : lang === 'ar' ? 'الدفع النقدي اليدوي' : 'Manual cash payment'}
            </div>
          </div>
          <button onClick={() => toggleProvider('cash')} className="transition-all" title={labels.showInMenu[lang]}>
            {config.cash !== false
              ? <ToggleRight className="w-8 h-8 text-success" />
              : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
            }
          </button>
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
          const logoUrl = logos[p.id as keyof PaymentLogos];
          return (
            <div key={p.id} className={`bg-card rounded-xl border transition-all ${enabled ? 'border-primary/30' : 'border-border opacity-70'} p-5`}>
              <div className="flex items-center gap-3 mb-4">
                {logoUrl ? (
                  <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden">
                    <img src={logoUrl} alt={p.name[lang]} className="w-8 h-8 object-contain" />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-xl ${p.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                )}
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

              {/* Logo Upload Section */}
              {p.hasLogo && (
                <div className="mb-3 bg-secondary/50 rounded-lg p-3 border border-border">
                  <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-2 font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" />
                    {labels.logo[lang]}
                  </div>
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <div className="relative w-14 h-14 rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden">
                        <img src={logoUrl} alt="" className="w-12 h-12 object-contain" />
                        <button
                          onClick={() => removeLogo(p.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-card">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      disabled={uploadingLogo === p.id}
                      onClick={() => fileRefs.current[p.id]?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50"
                    >
                      {uploadingLogo === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {logoUrl ? labels.changeLogo[lang] : labels.uploadLogo[lang]}
                    </button>
                    <input
                      ref={el => { fileRefs.current[p.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(p.id, file);
                        e.target.value = '';
                      }}
                    />
                  </div>
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
