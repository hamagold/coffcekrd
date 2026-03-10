import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/types';
import { defaultRobotItems, defaultStaffItems } from '@/data/menuData';

const dbToMenuItem = (row: any): MenuItem => ({
  id: row.item_id,
  cat: row.cat,
  subCat: row.sub_cat || '',
  emoji: row.emoji,
  name: { ku: row.name_ku, ar: row.name_ar, en: row.name_en },
  desc: { ku: row.desc_ku, ar: row.desc_ar, en: row.desc_en },
  price: row.price,
  image: row.image || undefined,
  outOfStock: row.out_of_stock || false,
});

const menuItemToDb = (item: MenuItem, menuType: 'robot' | 'staff', sortOrder: number) => ({
  item_id: item.id,
  cat: item.cat,
  sub_cat: item.subCat || '',
  emoji: item.emoji,
  name_ku: item.name.ku,
  name_ar: item.name.ar,
  name_en: item.name.en,
  desc_ku: item.desc.ku,
  desc_ar: item.desc.ar,
  desc_en: item.desc.en,
  price: item.price,
  image: item.image || null,
  out_of_stock: item.outOfStock || false,
  menu_type: menuType,
  sort_order: sortOrder,
});

export const useMenuItems = () => {
  const [robotItems, setRobotItemsState] = useState<MenuItem[]>(defaultRobotItems);
  const [staffItems, setStaffItemsState] = useState<MenuItem[]>(defaultStaffItems);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu items:', error);
      // Fallback to defaults
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const robot = data.filter((r: any) => r.menu_type === 'robot').map(dbToMenuItem);
      const staff = data.filter((r: any) => r.menu_type === 'staff').map(dbToMenuItem);
      setRobotItemsState(robot.length > 0 ? robot : defaultRobotItems);
      setStaffItemsState(staff.length > 0 ? staff : defaultStaffItems);
    } else {
      // Seed defaults into DB
      await seedDefaults();
    }
    setLoading(false);
  }, []);

  const seedDefaults = async () => {
    const rows = [
      ...defaultRobotItems.map((item, i) => menuItemToDb(item, 'robot', i)),
      ...defaultStaffItems.map((item, i) => menuItemToDb(item, 'staff', i)),
    ];
    await supabase.from('menu_items').insert(rows);
    setRobotItemsState(defaultRobotItems);
    setStaffItemsState(defaultStaffItems);
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('menu_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchItems]);

  const addItem = useCallback(async (item: MenuItem, menuType: 'robot' | 'staff') => {
    const currentItems = menuType === 'robot' ? robotItems : staffItems;
    const row = menuItemToDb(item, menuType, currentItems.length);
    const { error } = await supabase.from('menu_items').insert(row);
    if (error) throw error;
  }, [robotItems, staffItems]);

  const deleteItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('item_id', itemId);
    if (error) throw error;
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: Partial<MenuItem>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name) {
      if (updates.name.ku !== undefined) dbUpdates.name_ku = updates.name.ku;
      if (updates.name.ar !== undefined) dbUpdates.name_ar = updates.name.ar;
      if (updates.name.en !== undefined) dbUpdates.name_en = updates.name.en;
    }
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.image !== undefined) dbUpdates.image = updates.image || null;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.cat !== undefined) dbUpdates.cat = updates.cat;
    if (updates.subCat !== undefined) dbUpdates.sub_cat = updates.subCat;
    if (updates.outOfStock !== undefined) dbUpdates.out_of_stock = updates.outOfStock;
    const { error } = await supabase.from('menu_items').update(dbUpdates).eq('item_id', itemId);
    if (error) throw error;
  }, []);

  return { robotItems, staffItems, loading, addItem, deleteItem, updateItem, refetch: fetchItems };
};
