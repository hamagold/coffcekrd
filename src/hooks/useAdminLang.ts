import { useState, useEffect, useCallback } from 'react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';

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

export const getCafeName = (): string => {
  return localStorage.getItem('plc_cafe_name') || 'PLC';
};

export const setCafeName = (name: string) => {
  localStorage.setItem('plc_cafe_name', name);
};
