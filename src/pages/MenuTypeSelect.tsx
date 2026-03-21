import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { fetchCafeConfig } from '@/hooks/useAdminLang';
import { supabase } from '@/integrations/supabase/client';
import { Bot, ChefHat, ArrowRight, Sparkles } from 'lucide-react';
import robotDefault from '@/assets/robot-prepare.jpg';
import staffDefault from '@/assets/staff-prepare.jpg';

const MenuTypeSelect = () => {
  const navigate = useNavigate();
  const { language } = useStore();
  const t = translations[language];
  const isRtl = language === 'ku' || language === 'ar';

  const [robotImage, setRobotImage] = useState<string>(robotDefault);
  const [staffImage, setStaffImage] = useState<string>(staffDefault);
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
    setTimeout(() => navigate(`/menu?type=${type}`), 500);
  };

  const title = language === 'ku' ? 'چۆن ئامادەبکرێت؟' : language === 'ar' ? 'كيف يتم التحضير؟' : 'How would you like it?';
  const subtitle = language === 'ku' ? 'شێوازی ئامادەکردن هەڵبژێرە' : language === 'ar' ? 'اختر طريقة التحضير' : 'Choose your preparation style';

  const options = [
    {
      type: 'robot' as const,
      label: t.tabRobot || 'Robot Menu',
      sub: t.tabRobotSub || 'Automated preparation',
      icon: Bot,
      image: robotImage,
    },
    {
      type: 'staff' as const,
      label: t.tabStaff || 'Staff Menu',
      sub: t.tabStaffSub || 'Manual preparation',
      icon: ChefHat,
      image: staffImage,
    },
  ];

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="relative z-10 flex items-center justify-center px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-foreground text-base font-black tracking-[0.25em] uppercase">
            {cafeName}
          </span>
        </div>
      </header>

      {/* Title */}
      <div className="relative z-10 text-center px-4 pt-2 pb-5">
        <h1 className="text-foreground text-2xl sm:text-3xl font-black tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>
      </div>

      {/* Cards */}
      <div className="relative z-10 flex-1 flex flex-col sm:flex-row items-center justify-center gap-5 px-5 pb-8 sm:px-10">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeCard === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type)}
              className={`
                relative w-full sm:w-1/2 max-w-[400px] rounded-[2rem] overflow-hidden
                transition-all duration-500 ease-out cursor-pointer group
                border-2 border-transparent
                hover:border-primary/40
                ${isActive ? 'scale-[0.96] opacity-50' : 'hover:scale-[1.02]'}
              `}
              style={{
                aspectRatio: '3/4',
                maxHeight: 'calc(100dvh - 240px)',
              }}
            >
              {/* Image */}
              <img
                src={opt.image}
                alt={opt.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 transition-all duration-500 group-hover:from-black/70" />

              {/* Glow at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(to top, hsl(var(--primary) / 0.15), transparent)`,
                }}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 pb-10">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                    backdrop-blur-md border border-primary/30 bg-primary/10
                    transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/50
                    shadow-lg"
                  style={{
                    boxShadow: '0 8px 32px hsl(var(--primary) / 0.2)',
                  }}
                >
                  <Icon className="w-7 h-7 text-primary-foreground drop-shadow-md" style={{ color: 'hsl(var(--primary))' }} />
                </div>

                {/* Label */}
                <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight mb-1.5 drop-shadow-lg transition-transform duration-500 group-hover:-translate-y-1">
                  {opt.label}
                </h2>
                <p className="text-white/50 text-xs tracking-widest uppercase font-semibold transition-colors duration-500 group-hover:text-white/70">
                  {opt.sub}
                </p>

                {/* Arrow */}
                <div className="mt-5 w-10 h-10 rounded-full flex items-center justify-center
                  border border-white/10 bg-white/5 backdrop-blur-sm
                  transition-all duration-500 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:scale-110">
                  <ArrowRight className="w-4 h-4 text-white/40 transition-all duration-500 group-hover:text-primary group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MenuTypeSelect;
