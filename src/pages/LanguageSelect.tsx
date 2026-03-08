import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Language } from '@/types';
import { Coffee } from 'lucide-react';
import { fetchCafeConfig } from '@/hooks/useAdminLang';
import { fetchBackgroundImages } from '@/components/admin/AdminCafeSettings';
import { menuImages } from '@/data/menuImages';
const kurdistanFlag = '/lovable-uploads/bb9b46fd-41da-468f-bde5-dbf486a4dd75.webp';
import iraqFlag from '@/assets/flags/iraq.png';
import usaFlag from '@/assets/flags/usa.png';

// Default fallback: menu images
const defaultMenuImages = Object.values(menuImages);

const LanguageSelect = () => {
  const { setLanguage } = useStore();
  const navigate = useNavigate();
  const [cafeName, setCafeNameState] = useState('PLC');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hoveredLang, setHoveredLang] = useState<Language | null>(null);
  const [bgImages, setBgImages] = useState<string[]>(defaultMenuImages);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchCafeConfig().then(cfg => {
      setCafeNameState(cfg.name);
      setLogoUrl(cfg.logoUrl);
    });
    fetchBackgroundImages().then(images => {
      if (images.length > 0) setBgImages(images);
    });
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bgImages.length]);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/menu');
  };

  const languages = [
    { code: 'ku' as Language, name: 'کوردی', sub: 'Kurdish', dir: 'rtl', flag: kurdistanFlag, accent: '#f6f26d' },
    { code: 'ar' as Language, name: 'العربية', sub: 'Arabic', dir: 'rtl', flag: iraqFlag, accent: '#9eecff' },
    { code: 'en' as Language, name: 'English', sub: 'English', dir: 'ltr', flag: usaFlag, accent: '#ffb0be' },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Full-size slideshow background */}
      <div className="absolute inset-0 pointer-events-none">
        {bgImages.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: currentSlide === i ? 1 : 0 }}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--background))_85%)] pointer-events-none" />

      <div className="text-center relative z-10 w-full max-w-[460px] px-6">
        {/* Logo & Brand */}
        <div className="mb-12 animate-fade-up">
          {logoUrl ? (
            <img src={logoUrl} alt={cafeName} className="w-24 h-24 rounded-3xl object-cover mx-auto mb-6 border-2 border-border shadow-2xl" />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Coffee className="w-10 h-10 text-primary" />
            </div>
          )}
          <h1 className="text-5xl sm:text-6xl font-black text-foreground tracking-tighter mb-2 uppercase">
            {cafeName}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-primary/40" />
            <p className="text-primary text-xs font-bold tracking-[0.3em] uppercase">Robotic Café</p>
            <div className="h-[1px] w-8 bg-primary/40" />
          </div>
        </div>

        {/* Language Cards */}
        <div className="flex flex-col gap-3 w-full animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {languages.map((lang, i) => {
            const isHovered = hoveredLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                onMouseEnter={() => setHoveredLang(lang.code)}
                onMouseLeave={() => setHoveredLang(null)}
                className="group relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 border border-border hover:border-transparent"
                style={{
                  animationDelay: `${0.15 + i * 0.08}s`,
                  boxShadow: isHovered ? `0 8px 40px -12px ${lang.accent}40` : 'none',
                }}
              >
                {/* Flag background */}
                <div className="absolute inset-0">
                  <img
                    src={lang.flag}
                    alt={lang.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      background: isHovered
                        ? `linear-gradient(135deg, ${lang.accent}cc 0%, ${lang.accent}88 100%)`
                        : 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)',
                    }}
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between h-[88px] sm:h-[96px] px-6 sm:px-8" dir={lang.dir}>
                  <div className={`flex items-center gap-4 ${lang.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <span
                      className="text-3xl sm:text-4xl font-black tracking-tight transition-colors duration-500 drop-shadow-md"
                      style={{ color: isHovered ? 'hsl(var(--background))' : '#ffffff' }}
                    >
                      {lang.name}
                    </span>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 backdrop-blur-sm"
                    style={{
                      background: isHovered ? 'hsl(var(--background) / 0.3)' : 'rgba(255,255,255,0.15)',
                      transform: isHovered ? (lang.dir === 'rtl' ? 'translateX(-4px)' : 'translateX(4px)') : 'translateX(0)',
                    }}
                  >
                    <svg
                      className="w-5 h-5 transition-colors duration-500"
                      style={{ color: isHovered ? 'hsl(var(--background))' : '#ffffff', transform: lang.dir === 'rtl' ? 'scaleX(-1)' : 'none' }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer tagline */}
        <div className="mt-10 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-muted-foreground text-[11px] tracking-[0.2em] uppercase font-medium">
            Made by robots, loved by humans
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes floatItem {
          0%, 100% {
            transform: rotate(var(--rotate, 0deg)) translateY(0px) scale(1);
          }
          25% {
            transform: rotate(var(--rotate, 0deg)) translateY(-15px) scale(1.05);
          }
          50% {
            transform: rotate(var(--rotate, 0deg)) translateY(-8px) scale(0.98);
          }
          75% {
            transform: rotate(var(--rotate, 0deg)) translateY(-20px) scale(1.03);
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelect;
