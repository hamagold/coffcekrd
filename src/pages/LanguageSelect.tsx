import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Language } from '@/types';
import { fetchCafeConfig } from '@/hooks/useAdminLang';
import { fetchBackgroundImages } from '@/components/admin/AdminCafeSettings';
import { menuImages } from '@/data/menuImages';
const kurdistanFlag = '/lovable-uploads/bb9b46fd-41da-468f-bde5-dbf486a4dd75.webp';
import iraqFlag from '@/assets/flags/iraq.png';
import usaFlag from '@/assets/flags/usa.png';

const FROOZT_YELLOW = '#f6f26d';
const FROOZT_PINK = '#ffb0be';
const MONO = "'Courier New', 'Courier', monospace";

const defaultMenuImages = Object.values(menuImages);

const LanguageSelect = () => {
  const { setLanguage } = useStore();
  const navigate = useNavigate();
  const [cafeName, setCafeNameState] = useState('FROOZT');
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

  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bgImages.length]);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/select');
  };

  const languages = [
    { code: 'ku' as Language, name: 'کوردی', sub: 'KURDISH', flag: kurdistanFlag },
    { code: 'ar' as Language, name: 'العربية', sub: 'ARABIC', flag: iraqFlag },
    { code: 'en' as Language, name: 'English', sub: 'ENGLISH', flag: usaFlag },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-black relative overflow-hidden">
      {/* Slideshow background */}
      <div className="absolute inset-0 pointer-events-none">
        {bgImages.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: currentSlide === i ? 0.35 : 0 }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      {/* FROOZT Yellow Header Bar */}
      <div
        className="relative z-10 w-full py-3 text-center"
        style={{ background: FROOZT_YELLOW }}
      >
        <span
          className="text-black text-[10px] font-bold tracking-[0.4em] uppercase"
          style={{ fontFamily: MONO }}
        >
          ☰ ROBOTIC CAFÉ ☰
        </span>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Logo & Brand */}
        <div className="mb-10 text-center animate-fade-up">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={cafeName}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-5 shadow-2xl"
              style={{ border: `3px solid ${FROOZT_YELLOW}` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl"
              style={{ background: FROOZT_YELLOW, border: `3px solid ${FROOZT_YELLOW}` }}
            >
              <span className="text-3xl">🤖</span>
            </div>
          )}
          <h1
            className="text-5xl sm:text-6xl font-black text-white tracking-tighter mb-2 uppercase"
            style={{ fontFamily: MONO, textShadow: `0 0 40px ${FROOZT_YELLOW}40` }}
          >
            {cafeName}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[2px] w-10" style={{ background: FROOZT_YELLOW }} />
            <p
              className="text-[10px] font-bold tracking-[0.35em] uppercase"
              style={{ fontFamily: MONO, color: FROOZT_PINK }}
            >
              SELECT YOUR LANGUAGE
            </p>
            <div className="h-[2px] w-10" style={{ background: FROOZT_YELLOW }} />
          </div>
        </div>

        {/* Language Cards */}
        <div className="flex flex-col gap-4 w-full max-w-[420px] animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {languages.map((lang, i) => {
            const isHovered = hoveredLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                onMouseEnter={() => setHoveredLang(lang.code)}
                onMouseLeave={() => setHoveredLang(null)}
                className="group relative w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{
                  animationDelay: `${0.15 + i * 0.08}s`,
                  background: isHovered ? FROOZT_YELLOW : 'rgba(255,255,255,0.08)',
                  border: `2px solid ${isHovered ? FROOZT_YELLOW : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: isHovered ? `0 8px 30px -8px ${FROOZT_YELLOW}50` : 'none',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div className="relative z-10 flex items-center gap-5 h-[80px] px-5">
                  {/* Flag */}
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 transition-all duration-300 shadow-lg"
                    style={{
                      border: `3px solid ${isHovered ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}`,
                    }}
                  >
                    <img src={lang.flag} alt={lang.name} className="w-full h-full object-cover" />
                  </div>
                  {/* Text */}
                  <div className="flex flex-col items-start">
                    <span
                      className="text-2xl font-black tracking-tight transition-colors duration-300"
                      style={{
                        fontFamily: MONO,
                        color: isHovered ? '#000' : '#fff',
                      }}
                    >
                      {lang.name}
                    </span>
                    <span
                      className="text-[10px] font-bold tracking-[0.25em] uppercase transition-colors duration-300"
                      style={{
                        fontFamily: MONO,
                        color: isHovered ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {lang.sub}
                    </span>
                  </div>
                  {/* Arrow */}
                  <div className="ml-auto transition-all duration-300" style={{ color: isHovered ? '#000' : 'rgba(255,255,255,0.3)' }}>
                    <span className="text-xl font-bold" style={{ fontFamily: MONO }}>→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="relative z-10 w-full py-2.5 text-center"
        style={{ background: FROOZT_PINK }}
      >
        <span
          className="text-black/60 text-[9px] font-bold tracking-[0.3em] uppercase"
          style={{ fontFamily: MONO }}
        >
          TOUCH TO BEGIN • TAP TO START
        </span>
      </div>
    </div>
  );
};

export default LanguageSelect;
