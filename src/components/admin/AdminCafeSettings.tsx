import { useState, useEffect } from 'react';
import { Coffee, Save, Image, Trash2, Timer, Loader2, Plus, ImagePlus, Sun, Moon, Droplets, Leaf, Heart, Flame, Palette, Sparkles, Star, Waves, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { fetchCafeConfig, saveCafeConfig, invalidateCafeCache, CafeConfig } from '@/hooks/useAdminLang';
import { supabase } from '@/integrations/supabase/client';
import { useTheme, Theme } from '@/hooks/useTheme';

// Cache for background images
let cachedBgImages: string[] | null = null;

export const fetchBackgroundImages = async (): Promise<string[]> => {
  if (cachedBgImages) return cachedBgImages;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'background_images')
    .single();
  cachedBgImages = (data?.value as any)?.images || [];
  return cachedBgImages!;
};

export const invalidateBgImagesCache = () => {
  cachedBgImages = null;
};

type SettingsTab = 'general' | 'appearance' | 'behavior';

const AdminCafeSettings = ({ lang }: { lang: Language }) => {
  const { theme, setTheme } = useTheme();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [name, setName] = useState('PLC');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [inactivity, setInactivity] = useState({ enabled: true, timeout: 30 });
  const [bgImages, setBgImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    Promise.all([fetchCafeConfig(), fetchBackgroundImages()]).then(([config, images]) => {
      setName(config.name);
      setLogoUrl(config.logoUrl);
      setInactivity(config.inactivity);
      setBgImages(images);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCafeConfig({ name, logoUrl, inactivity });
      invalidateCafeCache();
      toast.success(t.saved);
      window.dispatchEvent(new Event('cafe-config-updated'));
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveBgImages = async (images: string[]) => {
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('key', 'background_images')
      .single();

    if (existing) {
      await supabase
        .from('app_settings')
        .update({ value: { images } as any, updated_at: new Date().toISOString() })
        .eq('key', 'background_images');
    } else {
      await supabase
        .from('app_settings')
        .insert({ key: 'background_images', value: { images } as any });
    }
    invalidateBgImagesCache();
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const newImages = [...bgImages, reader.result as string];
      setBgImages(newImages);
      await saveBgImages(newImages);
      toast.success(t.saved);
      setUploadingBg(false);
    };
    reader.readAsDataURL(file);
  };

  const removeBgImage = async (index: number) => {
    const newImages = bgImages.filter((_, i) => i !== index);
    setBgImages(newImages);
    await saveBgImages(newImages);
    toast.success(t.saved);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: lang === 'ku' ? 'گشتی' : lang === 'ar' ? 'عام' : 'General', icon: <Coffee className="w-4 h-4" /> },
    { id: 'appearance', label: lang === 'ku' ? 'ڕووکار' : lang === 'ar' ? 'المظهر' : 'Appearance', icon: <ImagePlus className="w-4 h-4" /> },
    { id: 'behavior', label: lang === 'ku' ? 'ڕەفتار' : lang === 'ar' ? 'السلوك' : 'Behavior', icon: <Timer className="w-4 h-4" /> },
  ];

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <Coffee className="w-5 h-5 text-muted-foreground" />
        {t.cafeSettingsTitle}
      </h2>
      <p className="text-muted-foreground text-sm mb-5">{t.cafeSettingsSub}</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary/50 rounded-xl p-1 border border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-4 animate-fade-up">
          {/* Cafe Name */}
          <div className="bg-card rounded-xl border border-border p-6">
            <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-2 font-semibold">{t.cafeName}</label>
            <input
              className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-lg font-bold focus:outline-none focus:border-primary/50 transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="PLC"
            />
            <p className="text-muted-foreground text-xs mt-2">{t.cafeNameDesc}</p>
          </div>

          {/* Cafe Logo */}
          <div className="bg-card rounded-xl border border-border p-6">
            <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-2 font-semibold">{t.cafeLogo}</label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-all flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" />
                  {t.uploadLogo}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                {logoUrl && (
                  <button onClick={() => setLogoUrl(null)} className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-semibold cursor-pointer hover:bg-destructive/20 transition-all flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.removeLogo}
                  </button>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-xs mt-2">{t.cafeLogoDesc}</p>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-4 animate-fade-up">
          {/* Background Images */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <ImagePlus className="w-4 h-4 text-muted-foreground" />
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-semibold">{t.backgroundImages}</label>
            </div>
            <p className="text-muted-foreground text-xs mb-4">{t.backgroundImagesDesc}</p>

            {bgImages.length === 0 ? (
              <p className="text-muted-foreground/60 text-xs mb-4 italic">{t.noBackgroundImages}</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-4">
                {bgImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-full aspect-square rounded-lg object-cover border border-border" />
                    <button
                      onClick={() => removeBgImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-all">
              {uploadingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {t.addImage}
              <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} disabled={uploadingBg} />
            </label>
          </div>

          {/* Theme Selector */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-semibold">{t.themeMode}</label>
            </div>
            <p className="text-muted-foreground text-xs mb-4">{t.themeModeDesc}</p>
            <div className="grid grid-cols-5 gap-2">
              {([
                { id: 'dark' as Theme, label: lang === 'ku' ? 'ڕەش' : lang === 'ar' ? 'داكن' : 'Dark', icon: <Moon className="w-3.5 h-3.5" />, color: 'hsl(38, 92%, 55%)' },
                { id: 'light' as Theme, label: lang === 'ku' ? 'سپی' : lang === 'ar' ? 'فاتح' : 'Light', icon: <Sun className="w-3.5 h-3.5" />, color: 'hsl(38, 92%, 50%)' },
                { id: 'midnight' as Theme, label: lang === 'ku' ? 'نیوەشەو' : lang === 'ar' ? 'منتصف' : 'Midnight', icon: <Star className="w-3.5 h-3.5" />, color: 'hsl(220, 70%, 55%)' },
                { id: 'blue' as Theme, label: lang === 'ku' ? 'شین' : lang === 'ar' ? 'أزرق' : 'Blue', icon: <Droplets className="w-3.5 h-3.5" />, color: 'hsl(210, 100%, 56%)' },
                { id: 'teal' as Theme, label: lang === 'ku' ? 'شینەکەوز' : lang === 'ar' ? 'أزرق مخضر' : 'Teal', icon: <Waves className="w-3.5 h-3.5" />, color: 'hsl(174, 70%, 42%)' },
                { id: 'green' as Theme, label: lang === 'ku' ? 'سەوز' : lang === 'ar' ? 'أخضر' : 'Green', icon: <Leaf className="w-3.5 h-3.5" />, color: 'hsl(152, 60%, 45%)' },
                { id: 'amber' as Theme, label: lang === 'ku' ? 'زەرد' : lang === 'ar' ? 'كهرماني' : 'Amber', icon: <Zap className="w-3.5 h-3.5" />, color: 'hsl(45, 93%, 47%)' },
                { id: 'warm' as Theme, label: lang === 'ku' ? 'گەرم' : lang === 'ar' ? 'دافئ' : 'Warm', icon: <Flame className="w-3.5 h-3.5" />, color: 'hsl(25, 85%, 50%)' },
                { id: 'rose' as Theme, label: lang === 'ku' ? 'وەردی' : lang === 'ar' ? 'وردي' : 'Rose', icon: <Heart className="w-3.5 h-3.5" />, color: 'hsl(346, 77%, 60%)' },
                { id: 'purple' as Theme, label: lang === 'ku' ? 'مۆر' : lang === 'ar' ? 'بنفسجي' : 'Purple', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'hsl(262, 60%, 58%)' },
                { id: 'gradient' as Theme, label: lang === 'ku' ? 'ڕەنگاوڕەنگ' : lang === 'ar' ? 'متدرج' : 'Gradient', icon: <Palette className="w-3.5 h-3.5" />, color: 'linear-gradient(135deg, hsl(280, 70%, 58%), hsl(200, 80%, 55%))' },
              ]).map(item => (
                <button
                  key={item.id}
                  onClick={() => setTheme(item.id)}
                  className={`py-2.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer ${
                    theme === item.id
                      ? 'border-primary shadow-md'
                      : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                  }`}
                  style={theme === item.id ? { background: item.color, color: '#fff', borderColor: item.id === 'gradient' ? 'hsl(280, 70%, 58%)' : item.color } : {}}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Behavior Tab */}
      {activeTab === 'behavior' && (
        <div className="space-y-4 animate-fade-up">
          {/* Menu Design Switcher */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Coffee className="w-4 h-4 text-muted-foreground" />
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-semibold">
                {lang === 'ku' ? 'دیزاینی مینۆ' : lang === 'ar' ? 'تصميم القائمة' : 'Menu Design'}
              </label>
            </div>
            <p className="text-muted-foreground text-xs mb-4">
              {lang === 'ku' ? 'دیزاینی مینۆ هەڵبژێرە بۆ بەکارهێنەرەکان' : lang === 'ar' ? 'اختر تصميم القائمة للعملاء' : 'Choose menu design for customers'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'classic' as const, label: lang === 'ku' ? 'کلاسیک' : lang === 'ar' ? 'كلاسيكي' : 'Classic', desc: lang === 'ku' ? 'دیزاینی ئاسایی' : lang === 'ar' ? 'التصميم العادي' : 'Standard design', icon: '☕' },
                { id: 'froozt' as const, label: 'FROOZT', desc: lang === 'ku' ? 'دیزاینی زەرد و مۆدێرن' : lang === 'ar' ? 'تصميم أصفر حديث' : 'Yellow modern design', icon: '🍌' },
              ]).map(design => {
                const menuDesign = (name === 'PLC' ? 'froozt' : 'froozt'); // default
                const currentDesign = (() => {
                  // Read from a local state
                  return menuDesignState;
                })();
                return (
                  <button
                    key={design.id}
                    onClick={() => setMenuDesignState(design.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
                      currentDesign === design.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">{design.icon}</div>
                    <div className="text-foreground font-bold text-sm">{design.label}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{design.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inactivity Timeout */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-semibold">{t.inactivityTimeout}</label>
            </div>
            <p className="text-muted-foreground text-xs mb-4">{t.inactivityDesc}</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inactivity.enabled}
                  onChange={e => setInactivity({ ...inactivity, enabled: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-foreground text-sm">{t.inactivityEnabled}</span>
              </label>
              {inactivity.enabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={inactivity.timeout}
                    onChange={e => setInactivity({ ...inactivity, timeout: Number(e.target.value) })}
                    className="w-20 p-2 bg-secondary border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:border-primary/50"
                  />
                  <span className="text-muted-foreground text-xs">{t.seconds}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t.save}
      </button>
    </div>
  );
};

export default AdminCafeSettings;
