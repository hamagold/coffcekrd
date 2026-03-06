import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Language } from '@/types';

const LanguageSelect = () => {
  const { setLanguage } = useStore();
  const navigate = useNavigate();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/menu');
  };

  const languages = [
    { code: 'ku' as Language, flag: '🏔️', name: 'کوردی', native: 'Kurdish' },
    { code: 'ar' as Language, flag: '🌙', name: 'عربي', native: 'Arabic' },
    { code: 'en' as Language, flag: '🌍', name: 'English', native: 'English' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.15)_0%,transparent_70%)] animate-pulse-gold" />

      <div className="text-center relative z-10">
        {/* Logo */}
        <div className="mb-16">
          <div className="w-[120px] h-[120px] border-[3px] border-primary rounded-full flex items-center justify-center mx-auto mb-5 animate-glow-border relative">
            <div className="absolute w-[110px] h-[110px] border border-primary/30 rounded-full" />
            <span className="text-4xl font-black text-primary font-display">PLC</span>
          </div>
          <h1 className="text-5xl font-black text-primary font-display tracking-[8px] drop-shadow-[0_0_30px_hsl(var(--gold)/0.5)]">
            PLC
          </h1>
          <p className="text-primary/60 tracking-[4px] mt-2 text-base">PREMIUM CAFETERIA SYSTEM</p>
        </div>

        {/* Language prompt */}
        <p className="text-foreground/80 text-xl mb-10">
          Please select your language • اختر لغتك • زمانەکەت هەڵبژێرە
        </p>

        {/* Language buttons */}
        <div className="grid grid-cols-3 gap-6">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-[180px] h-[180px] bg-gradient-to-br from-secondary to-background border-2 border-primary/30 rounded-[20px] flex flex-col items-center justify-center cursor-pointer transition-all duration-400 relative overflow-hidden group hover:border-primary hover:-translate-y-2 hover:scale-105 hover:shadow-[0_20px_40px_hsl(var(--gold)/0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[56px] mb-3 relative z-10">{lang.flag}</span>
              <span className="text-primary text-xl font-bold relative z-10">{lang.name}</span>
              <span className="text-foreground/50 text-sm mt-1 relative z-10">{lang.native}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Admin link */}
      <a
        href="/admin"
        onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
        className="fixed bottom-5 left-5 bg-background/80 border border-primary/30 px-4 py-2 rounded-lg text-primary/50 text-xs cursor-pointer transition-all hover:border-primary hover:text-primary z-50"
      >
        ⚙️ Admin
      </a>
    </div>
  );
};

export default LanguageSelect;
