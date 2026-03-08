import { useState, useEffect } from 'react';
import { Coffee, Save, Image, Trash2, Timer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { fetchCafeConfig, saveCafeConfig, invalidateCafeCache, CafeConfig } from '@/hooks/useAdminLang';

const AdminCafeSettings = ({ lang }: { lang: Language }) => {
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [name, setName] = useState('PLC');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [inactivity, setInactivity] = useState({ enabled: true, timeout: 30 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCafeConfig().then(config => {
      setName(config.name);
      setLogoUrl(config.logoUrl);
      setInactivity(config.inactivity);
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
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <Coffee className="w-5 h-5 text-muted-foreground" />
        {t.cafeSettingsTitle}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">{t.cafeSettingsSub}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
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

      {/* Inactivity Timeout */}
      <div className="bg-card rounded-xl border border-border p-6 mb-5">
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

      <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t.save}
      </button>
    </div>
  );
};

export default AdminCafeSettings;
