import { useState, useEffect, useCallback } from 'react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { supabase } from '@/integrations/supabase/client';

export const useAdminLang = () => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('plc_admin_lang') as Language) || 'ku';
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('plc_admin_lang', l);
  }, []);

  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  return { lang, setLang, t, dir };
};

// Cache for cafe config
export interface CafeConfig {
  name: string;
  logoUrl: string | null;
  inactivity: { enabled: boolean; timeout: number };
  menuDesign?: 'classic' | 'froozt';
}

let cachedCafeConfig: CafeConfig | null = null;

export const fetchCafeConfig = async (): Promise<CafeConfig> => {
  if (cachedCafeConfig) return cachedCafeConfig;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'cafe_config')
    .single();
  cachedCafeConfig = (data?.value as any) || { name: 'PLC', logoUrl: null, inactivity: { enabled: true, timeout: 30 } };
  return cachedCafeConfig!;
};

export const invalidateCafeCache = () => {
  cachedCafeConfig = null;
};

export const getCafeName = (): string => {
  return cachedCafeConfig?.name || 'PLC';
};

export const getCafeLogoUrl = (): string | null => {
  return cachedCafeConfig?.logoUrl || null;
};

export const saveCafeConfig = async (config: CafeConfig): Promise<void> => {
  const { error } = await supabase
    .from('app_settings')
    .update({ value: config as any, updated_at: new Date().toISOString() })
    .eq('key', 'cafe_config');
  if (error) throw error;
  cachedCafeConfig = config;
};
