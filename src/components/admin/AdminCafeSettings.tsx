import { useState } from 'react';
import { Coffee, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { getCafeName, setCafeName } from '@/hooks/useAdminLang';

const AdminCafeSettings = ({ lang }: { lang: Language }) => {
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [name, setName] = useState(getCafeName);

  const handleSave = () => {
    setCafeName(name);
    toast.success(t.saved);
    // Dispatch storage event so other components update
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <Coffee className="w-5 h-5 text-muted-foreground" />
        {t.cafeSettingsTitle}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">{t.cafeSettingsSub}</p>

      <div className="bg-card rounded-xl border border-border p-6 mb-5">
        <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-2 font-semibold">{t.cafeName}</label>
        <input
          className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-lg font-bold focus:outline-none focus:border-primary/50 transition-colors"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="PLC"
        />
        <p className="text-muted-foreground text-xs mt-2">{t.cafeNameDesc}</p>
      </div>

      <button onClick={handleSave} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer hover:opacity-90 transition-all flex items-center gap-2">
        <Save className="w-4 h-4" />
        {t.save}
      </button>
    </div>
  );
};

export default AdminCafeSettings;
