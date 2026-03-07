import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Language } from '@/types';
import { Globe, Coffee, ChevronRight } from 'lucide-react';
import { getCafeName } from '@/hooks/useAdminLang';
import kurdistanFlag from '@/assets/flags/kurdistan.png';
import iraqFlag from '@/assets/flags/iraq.png';
import usaFlag from '@/assets/flags/usa.png';

const LanguageSelect = () => {
  const { setLanguage } = useStore();
  const navigate = useNavigate();
  const [cafeName, setCafeNameState] = useState(getCafeName);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = () => {
      setCafeNameState(getCafeName());
      setLogoUrl(localStorage.getItem('plc_cafe_logo'));
    };
    handleStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/menu');
  };

  const languages = [
    { code: 'ku' as Language, name: 'کوردی', sub: 'Kurdish', dir: 'rtl', flag: kurdistanFlag },
    { code: 'ar' as Language, name: 'العربية', sub: 'Arabic', dir: 'rtl', flag: iraqFlag },
    { code: 'en' as Language, name: 'English', sub: 'English', dir: 'ltr', flag: usaFlag },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.06)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,hsl(var(--primary)/0.04)_0%,transparent_70%)]" />

      <div className="text-center relative z-10 animate-fade-up">
        <div className="mb-14">
          {logoUrl ? (
            <img src={logoUrl} alt={cafeName} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-5 border border-border shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Coffee className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-1">
            {cafeName}
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">CAFETERIA</p>
        </div>

        <div className="flex items-center gap-2 justify-center mb-8">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Select your language</p>
        </div>

        <div className="flex flex-col gap-3 w-[320px] mx-auto">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="group w-full px-5 py-4 bg-card border border-border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center gap-3" dir={lang.dir}>
                <img src={lang.flag} alt={lang.name} className="w-8 h-6 rounded object-cover shadow-sm" />
                <div>
                  <span className="text-foreground text-lg font-semibold block">{lang.name}</span>
                  <span className="text-muted-foreground text-xs">{lang.sub}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelect;
