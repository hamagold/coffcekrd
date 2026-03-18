import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Variant {
  id: string;
  item_id: string;
  name_ku: string;
  name_ar: string;
  name_en: string;
  price: number;
  sort_order: number;
}

export const useVariants = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVariants = useCallback(async () => {
    const { data, error } = await supabase
      .from('menu_item_variants')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setVariants(data as Variant[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const getVariantsForItem = useCallback((itemId: string) => {
    return variants.filter(v => v.item_id === itemId);
  }, [variants]);

  const addVariant = useCallback(async (variant: Omit<Variant, 'id'>) => {
    const { error } = await supabase.from('menu_item_variants').insert(variant as any);
    if (error) throw error;
    await fetchVariants();
  }, [fetchVariants]);

  const updateVariant = useCallback(async (id: string, updates: Partial<Variant>) => {
    const { error } = await supabase.from('menu_item_variants').update(updates as any).eq('id', id);
    if (error) throw error;
    await fetchVariants();
  }, [fetchVariants]);

  const deleteVariant = useCallback(async (id: string) => {
    const { error } = await supabase.from('menu_item_variants').delete().eq('id', id);
    if (error) throw error;
    await fetchVariants();
  }, [fetchVariants]);

  return { variants, loading, getVariantsForItem, addVariant, updateVariant, deleteVariant, fetchVariants };
};
