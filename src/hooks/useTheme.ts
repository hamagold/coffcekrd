import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'dark' | 'light';

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
  document.documentElement.classList.remove('light');
  if (theme === 'light') {
    document.documentElement.classList.add('light');
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
