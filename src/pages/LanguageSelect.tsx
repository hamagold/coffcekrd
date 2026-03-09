import { useState, useEffect } from 'react';
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
    <div className="flex min-h-screen flex-col justify-end bg-background relative overflow-hidden">
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

      {/* Lighter gradient - only darken bottom for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90 pointer-events-none" />

      <div className="absolute bottom-0 left-1/2 z-10 w-full max-w-[460px] -translate-x-1/2 px-6 pb-8 pt-4 text-center">
        {/* Logo & Brand */}
        <div className="mb-6 animate-fade-up">
          {logoUrl ? (
            <img src={logoUrl} alt={cafeName} className="w-20 h-20 rounded-3xl object-cover mx-auto mb-4 border-2 border-border shadow-2xl" />
          ) : (
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-xl backdrop-blur-md">
              <Coffee className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-1 uppercase drop-shadow-lg">
            {cafeName}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-white/40" />
            <p className="text-white/80 text-xs font-bold tracking-[0.3em] uppercase drop-shadow">Robotic Café</p>
            <div className="h-[1px] w-8 bg-white/40" />
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
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    background: isHovered
                      ? `linear-gradient(135deg, ${lang.accent}dd 0%, ${lang.accent}99 100%)`
                      : 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)',
                    backdropFilter: 'blur(12px)',
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center gap-4 h-[88px] sm:h-[96px] px-5 sm:px-7">
                  {/* Flag circle */}
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-[3px] transition-all duration-500 shadow-lg flex-shrink-0"
                    style={{
                      borderColor: isHovered ? 'hsl(var(--background) / 0.5)' : 'rgba(255,255,255,0.4)',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <img
                      src={lang.flag}
                      alt={lang.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span
                      className="text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-500 drop-shadow-md"
                      style={{ color: isHovered ? 'hsl(var(--background))' : '#ffffff' }}
                    >
                      {lang.name}
                    </span>
                    <span
                      className="text-[11px] font-semibold tracking-wider uppercase transition-colors duration-500 drop-shadow"
                      style={{ color: isHovered ? 'hsl(var(--background) / 0.7)' : 'rgba(255,255,255,0.6)' }}
                    >
                      {lang.sub}
                    </span>
                  </div>
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default LanguageSelect;
