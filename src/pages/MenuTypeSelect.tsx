import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { fetchCafeConfig } from '@/hooks/useAdminLang';
import { supabase } from '@/integrations/supabase/client';
import { Bot, ChefHat, ArrowLeft, Sparkles } from 'lucide-react';

const MenuTypeSelect = () => {
  const navigate = useNavigate();
  const { language } = useStore();
  const t = translations[language];
  const isRtl = language === 'ku' || language === 'ar';

  const [robotImage, setRobotImage] = useState<string | null>(null);
  const [staffImage, setStaffImage] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState('FROOZT');
  const [activeCard, setActiveCard] = useState<'robot' | 'staff' | null>(null);

  useEffect(() => {
    fetchCafeConfig().then(cfg => setCafeName(cfg.name));
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['menu_type_robot_image', 'menu_type_staff_image'])
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.key === 'menu_type_robot_image' && row.value) setRobotImage(row.value as string);
            if (row.key === 'menu_type_staff_image' && row.value) setStaffImage(row.value as string);
          }
        }
      });
  }, []);

  const handleSelect = (type: 'robot' | 'staff') => {
    setActiveCard(type);
    setTimeout(() => navigate(`/menu?type=${type}`), 400);
  };

  const options = [
    {
      type: 'robot' as const,
      label: t.tabRobot || 'Robot Menu',
      sub: t.tabRobotSub || 'Automated preparation',
      icon: Bot,
      image: robotImage,
      gradient: 'from-primary/20 via-accent/10 to-transparent',
      accentHsl: 'hsl(var(--primary))',
      glowColor: 'hsl(var(--primary) / 0.4)',
    },
    {
      type: 'staff' as const,
      label: t.tabStaff || 'Staff Menu',
      sub: t.tabStaffSub || 'Manual preparation',
      icon: ChefHat,
      image: staffImage,
      gradient: 'from-primary/20 via-accent/10 to-transparent',
      accentHsl: 'hsl(var(--primary))',
      glowColor: 'hsl(var(--primary) / 0.4)',
    },
  ];

  return (
    <div
      className="flex min-h-[100dvh] flex-col overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }} />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
          <span className="text-xs tracking-wider uppercase">
            {language === 'ku' ? 'گەڕانەوە' : language === 'ar' ? 'رجوع' : 'Back'}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary opacity-60" />
          <span className="text-foreground text-sm font-black tracking-[0.2em] uppercase">
            {cafeName}
          </span>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Title */}
      <div className="relative z-10 text-center px-4 pb-4">
        <h1 className="text-foreground text-xl sm:text-2xl font-black tracking-tight">
          {language === 'ku' ? 'چۆن ئامادەبکرێت؟' : language === 'ar' ? 'كيف يتم التحضير؟' : 'How would you like it?'}
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          {language === 'ku' ? 'شێوازی ئامادەکردن هەڵبژێرە' : language === 'ar' ? 'اختر طريقة التحضير' : 'Choose your preparation style'}
        </p>
      </div>

      {/* Cards */}
      <div className="relative z-10 flex-1 flex flex-col sm:flex-row items-center justify-center gap-5 px-5 pb-6 sm:px-8">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeCard === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type)}
              className={`
                relative w-full sm:w-1/2 max-w-[340px] rounded-3xl overflow-hidden
                transition-all duration-500 ease-out cursor-pointer
                border border-border/60 hover:border-border
                group
                ${isActive ? 'scale-95 opacity-60' : 'hover:scale-[1.03]'}
              `}
              style={{
                aspectRatio: '3/4',
                maxHeight: 'calc(100dvh - 220px)',
                boxShadow: `0 20px 60px -20px ${opt.glowColor}`,
              }}
            >
              {/* Background image or fallback */}
              {opt.image ? (
                <img
                  src={opt.image}
                  alt={opt.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-card">
                  <div className={`absolute inset-0 bg-gradient-to-t ${opt.gradient}`} />
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                      backgroundSize: '24px 24px',
                    }}
                  />
                  {/* Large background icon */}
                  <Icon
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-32 h-32 opacity-[0.06] transition-all duration-700 group-hover:opacity-[0.12] group-hover:scale-110"
                    style={{ color: opt.accentHsl }}
                  />
                </div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 pb-8">
                {/* Icon badge */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 backdrop-blur-sm"
                  style={{
                    background: `linear-gradient(135deg, ${opt.accentHsl}, transparent)`,
                    border: `1.5px solid ${opt.accentHsl}`,
                    boxShadow: `0 8px 32px -8px ${opt.glowColor}`,
                  }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Text */}
                <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight mb-2 transition-transform duration-500 group-hover:-translate-y-1">
                  {opt.label}
                </h2>
                <p className="text-white/50 text-xs tracking-wider uppercase font-bold transition-all duration-500 group-hover:text-white/70">
                  {opt.sub}
                </p>

                {/* Arrow indicator */}
                <div
                  className="mt-5 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition-all duration-500 group-hover:border-white/30 group-hover:scale-110 group-hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 text-white/40 rotate-180 rtl:rotate-0 transition-all duration-500 group-hover:text-white/80 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </div>
              </div>

              {/* Top-right subtle label */}
              <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
                <span
                  className="text-[9px] tracking-[0.2em] uppercase font-black px-3 py-1.5 rounded-full backdrop-blur-md transition-all duration-500 border"
                  style={{
                    color: opt.accentHsl,
                    borderColor: `${opt.accentHsl}40`,
                    background: 'rgba(0,0,0,0.4)',
                  }}
                >
                  {opt.type === 'robot' ? '🤖' : '👨‍🍳'} {opt.type}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom subtle branding */}
      <div className="relative z-10 pb-4 text-center">
        <span className="text-muted-foreground/30 text-[9px] tracking-[0.3em] uppercase font-bold">
          Powered by PLC
        </span>
      </div>
    </div>
  );
};

export default MenuTypeSelect;
