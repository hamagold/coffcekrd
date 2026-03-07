import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Language } from '@/types';
import { Globe, Coffee, ChevronRight } from 'lucide-react';
import { getCafeName } from '@/hooks/useAdminLang';
const kurdistanFlag = '/lovable-uploads/bb9b46fd-41da-468f-bde5-dbf486a4dd75.webp';
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.06)_0%,transparent_70%)]" />

      <div className="text-center relative z-10 animate-fade-up w-full max-w-[420px]">
        <div className="mb-10">
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

        <div className="flex flex-col gap-4 w-full">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="group relative w-full h-24 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl shadow-md"
            >
              <img
                src={lang.flag}
                alt={lang.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="relative z-10 flex items-center h-full px-6" dir={lang.dir}>
                <span className="text-white text-3xl font-bold drop-shadow-lg">
                  {lang.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelect;
