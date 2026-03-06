import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Language } from '@/types';
import { Globe, Coffee, ChevronRight, Settings } from 'lucide-react';

const LanguageSelect = () => {
  const { setLanguage } = useStore();
  const navigate = useNavigate();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/menu');
  };

  const languages = [
    { code: 'ku' as Language, name: 'کوردی', sub: 'Kurdish', dir: 'rtl' },
    { code: 'ar' as Language, name: 'العربية', sub: 'Arabic', dir: 'rtl' },
    { code: 'en' as Language, name: 'English', sub: 'English', dir: 'ltr' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.06)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,hsl(var(--primary)/0.04)_0%,transparent_70%)]" />

      <div className="text-center relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="mb-14">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Coffee className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-1">
            PLC
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Premium Cafeteria</p>
        </div>

        {/* Language prompt */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Select your language
          </p>
        </div>

        {/* Language buttons */}
        <div className="flex flex-col gap-3 w-[320px] mx-auto">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="group w-full px-5 py-4 bg-card border border-border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="text-left" dir={lang.dir}>
                <span className="text-foreground text-lg font-semibold block">{lang.name}</span>
                <span className="text-muted-foreground text-xs">{lang.sub}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Admin link */}
      <button
        onClick={() => navigate('/admin')}
        className="fixed bottom-5 left-5 flex items-center gap-1.5 bg-card border border-border px-3 py-2 rounded-lg text-muted-foreground text-xs cursor-pointer transition-all hover:border-primary/30 hover:text-foreground z-50"
      >
        <Settings className="w-3.5 h-3.5" />
        Admin
      </button>
    </div>
  );
};

export default LanguageSelect;
