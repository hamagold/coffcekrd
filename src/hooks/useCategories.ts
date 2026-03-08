import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types';
import { robotCategories as defaultRobotCats, staffCategories as defaultStaffCats } from '@/data/menuData';

interface DbCategory {
  id: string;
  cat_id: string;
  icon: string;
  name_ku: string;
  name_ar: string;
  name_en: string;
  menu_type: string;
  sort_order: number;
}

const dbToCategory = (row: DbCategory): Category => ({
  id: row.cat_id,
  icon: row.icon,
  name: { ku: row.name_ku, ar: row.name_ar, en: row.name_en },
});

export const useCategories = () => {
  const [robotCategories, setRobotCategories] = useState<Category[]>(defaultRobotCats);
  const [staffCategories, setStaffCategories] = useState<Category[]>(defaultStaffCats);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const robot = (data as DbCategory[]).filter(r => r.menu_type === 'robot').map(dbToCategory);
      const staff = (data as DbCategory[]).filter(r => r.menu_type === 'staff').map(dbToCategory);
      setRobotCategories(robot.length > 0 ? robot : defaultRobotCats);
      setStaffCategories(staff.length > 0 ? staff : defaultStaffCats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const channel = supabase
      .channel('menu_categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => {
        fetchCategories();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCategories]);

  const addCategory = useCallback(async (cat: { catId: string; icon: string; nameKu: string; nameAr: string; nameEn: string; menuType: string }) => {
    const currentCats = cat.menuType === 'robot' ? robotCategories : staffCategories;
    const { error } = await supabase.from('menu_categories').insert({
      cat_id: cat.catId,
      icon: cat.icon,
      name_ku: cat.nameKu,
      name_ar: cat.nameAr,
      name_en: cat.nameEn,
      menu_type: cat.menuType,
      sort_order: currentCats.length,
    });
    if (error) throw error;
  }, [robotCategories, staffCategories]);

  const deleteCategory = useCallback(async (catId: string) => {
    const { error } = await supabase.from('menu_categories').delete().eq('cat_id', catId);
    if (error) throw error;
  }, []);

  return { robotCategories, staffCategories, loading, addCategory, deleteCategory, refetch: fetchCategories };
};
