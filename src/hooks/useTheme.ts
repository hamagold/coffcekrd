import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Theme = 'dark' | 'light' | 'blue' | 'green' | 'rose' | 'warm';

const ALL_THEME_CLASSES = ['light', 'theme-blue', 'theme-green', 'theme-rose', 'theme-warm'];

let cachedTheme: Theme | null = null;

export const fetchTheme = async (): Promise<Theme> => {
  if (cachedTheme) return cachedTheme;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'app_theme')
    .single();
  cachedTheme = (data?.value as any)?.theme || 'dark';
  return cachedTheme!;
};

export const saveTheme = async (theme: Theme): Promise<void> => {
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', 'app_theme')
    .single();

  if (existing) {
    await supabase
      .from('app_settings')
      .update({ value: { theme } as any, updated_at: new Date().toISOString() })
      .eq('key', 'app_theme');
  } else {
    await supabase
      .from('app_settings')
      .insert({ key: 'app_theme', value: { theme } as any });
  }
  cachedTheme = theme;
};

const applyTheme = (theme: Theme) => {
  const el = document.documentElement;
  ALL_THEME_CLASSES.forEach(cls => el.classList.remove(cls));
  
  switch (theme) {
    case 'light': el.classList.add('light'); break;
    case 'blue': el.classList.add('theme-blue'); break;
    case 'green': el.classList.add('theme-green'); break;
    case 'rose': el.classList.add('theme-rose'); break;
    case 'warm': el.classList.add('theme-warm'); break;
    // 'dark' is the default :root
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    fetchTheme().then(t => {
      setThemeState(t);
      applyTheme(t);
    });
  }, []);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    await saveTheme(t);
  };

  return { theme, setTheme };
};

// Apply theme on app load (call once)
export const initTheme = () => {
  fetchTheme().then(applyTheme);
};
