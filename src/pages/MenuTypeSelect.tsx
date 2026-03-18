import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { translations } from '@/data/translations';
import { fetchCafeConfig } from '@/hooks/useAdminLang';
import { supabase } from '@/integrations/supabase/client';
import { Bot, ChefHat } from 'lucide-react';

const FROOZT_YELLOW = '#f6f26d';
const FROOZT_PINK = '#ffb0be';
const MONO = "'Courier New', 'Courier', monospace";

// Default placeholder images
const defaultRobotImg = '';
const defaultStaffImg = '';

const MenuTypeSelect = () => {
  const navigate = useNavigate();
  const { language } = useStore();
  const t = translations[language];
  const isRtl = language === 'ku' || language === 'ar';

  const [robotImage, setRobotImage] = useState<string | null>(null);
  const [staffImage, setStaffImage] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState('FROOZT');
  const [hoveredType, setHoveredType] = useState<'robot' | 'staff' | null>(null);

  useEffect(() => {
    fetchCafeConfig().then(cfg => setCafeName(cfg.name));

    // Load custom images from app_settings
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['menu_type_robot_image', 'menu_type_staff_image'])
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.key === 'menu_type_robot_image' && row.value) {
              setRobotImage(row.value as string);
            }
            if (row.key === 'menu_type_staff_image' && row.value) {
              setStaffImage(row.value as string);
            }
          }
        }
      });
  }, []);

  const handleSelect = (type: 'robot' | 'staff') => {
    navigate(`/menu?type=${type}`);
  };

  const options = [
    {
      type: 'robot' as const,
      label: t.tabRobot || 'Robot Menu',
      sub: t.tabRobotSub || 'Automated preparation',
      icon: Bot,
      image: robotImage,
      color: FROOZT_YELLOW,
    },
    {
      type: 'staff' as const,
      label: t.tabStaff || 'Staff Menu',
      sub: t.tabStaffSub || 'Manual preparation',
      icon: ChefHat,
      image: staffImage,
      color: FROOZT_PINK,
    },
  ];

  return (
    <div
      className="flex min-h-screen flex-col bg-black"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div
        className="w-full py-3 text-center"
        style={{ background: FROOZT_YELLOW }}
      >
        <span
          className="text-black text-sm font-black tracking-[0.3em] uppercase"
          style={{ fontFamily: MONO }}
        >
          {cafeName}
        </span>
      </div>

      {/* Main content - two big cards */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 p-4 sm:p-6">
        {options.map((opt) => {
          const isHovered = hoveredType === opt.type;
          const Icon = opt.icon;
          return (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type)}
              onMouseEnter={() => setHoveredType(opt.type)}
              onMouseLeave={() => setHoveredType(null)}
              className="group relative w-full md:w-1/2 max-w-[380px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500"
              style={{
                aspectRatio: '4/5',
                maxHeight: 'calc(100vh - 180px)',
                border: `3px solid ${isHovered ? opt.color : 'rgba(255,255,255,0.15)'}`,
                boxShadow: isHovered ? `0 0 60px -10px ${opt.color}60` : 'none',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Background image */}
              {opt.image ? (
                <img
                  src={opt.image}
                  alt={opt.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                  style={{
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                  <Icon
                    size={120}
                    className="transition-all duration-500"
                    style={{
                      color: isHovered ? opt.color : 'rgba(255,255,255,0.15)',
                    }}
                  />
                </div>
              )}

              {/* Dark overlay */}
              <div
                className="absolute inset-0 transition-all duration-500"
                style={{
                  background: isHovered
                    ? `linear-gradient(to top, ${opt.color}CC 0%, transparent 60%)`
                    : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%)',
                }}
              />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-center z-10">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 transition-all duration-500"
                  style={{
                    background: isHovered ? 'rgba(0,0,0,0.3)' : `${opt.color}30`,
                    border: `2px solid ${isHovered ? 'rgba(0,0,0,0.2)' : opt.color}`,
                  }}
                >
                  <Icon
                    size={28}
                    style={{ color: isHovered ? '#000' : opt.color }}
                    className="transition-colors duration-500"
                  />
                </div>
                <h2
                  className="text-3xl sm:text-4xl font-black tracking-tight mb-2 transition-colors duration-500"
                  style={{
                    fontFamily: MONO,
                    color: isHovered ? '#000' : '#fff',
                  }}
                >
                  {opt.label}
                </h2>
                <p
                  className="text-sm font-bold tracking-wide uppercase transition-colors duration-500"
                  style={{
                    fontFamily: MONO,
                    color: isHovered ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {opt.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div
        className="w-full py-2.5 text-center"
        style={{ background: FROOZT_PINK }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-black/60 text-[9px] font-bold tracking-[0.3em] uppercase hover:text-black/90 transition-colors"
          style={{ fontFamily: MONO }}
        >
          ← {language === 'ku' ? 'گەڕانەوە' : language === 'ar' ? 'رجوع' : 'BACK'}
        </button>
      </div>
    </div>
  );
};

export default MenuTypeSelect;
