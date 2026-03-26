import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/types';
import { defaultRobotItems, defaultStaffItems } from '@/data/menuData';

const dbToMenuItem = (row: any): MenuItem => ({
  id: row.item_id,
  cat: row.cat,
  emoji: row.emoji,
  name: { ku: row.name_ku, ar: row.name_ar, en: row.name_en },
  desc: { ku: row.desc_ku, ar: row.desc_ar, en: row.desc_en },
  price: row.price,
  image: row.image || undefined,
  plc_code: row.plc_code || 0,
  out_of_stock: row.out_of_stock || false,
  has_params: row.has_params || false,
});

const menuItemToDb = (item: MenuItem, menuType: 'robot' | 'staff', sortOrder: number) => ({
  item_id: item.id,
  cat: item.cat,
  emoji: item.emoji,
  name_ku: item.name.ku,
  name_ar: item.name.ar,
  name_en: item.name.en,
  desc_ku: item.desc.ku,
  desc_ar: item.desc.ar,
  desc_en: item.desc.en,
  price: item.price,
  image: item.image || null,
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
    let nextCode = item.plc_code || 0;
    if (nextCode === 0) {
      // Auto-generate unique plc_code: find max existing and add 1
      const { data: maxData } = await supabase
        .from('menu_items')
        .select('plc_code')
        .order('plc_code', { ascending: false })
        .limit(1);
      nextCode = (maxData && maxData.length > 0 ? (maxData[0] as any).plc_code : 0) + 1;
    }
    const itemWithCode = { ...item, plc_code: nextCode };
    const row = { ...menuItemToDb(itemWithCode, menuType, currentItems.length), plc_code: nextCode };
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
    if (updates.out_of_stock !== undefined) dbUpdates.out_of_stock = updates.out_of_stock;
    if (updates.plc_code !== undefined) dbUpdates.plc_code = updates.plc_code;
    if (updates.has_params !== undefined) dbUpdates.has_params = updates.has_params;
    const { error } = await supabase.from('menu_items').update(dbUpdates as any).eq('item_id', itemId);
    if (error) throw error;
  }, []);

  const toggleOutOfStock = useCallback(async (itemId: string, currentValue: boolean) => {
    const { error } = await supabase.from('menu_items').update({ out_of_stock: !currentValue }).eq('item_id', itemId);
    if (error) throw error;
  }, []);

  return { robotItems, staffItems, loading, addItem, deleteItem, updateItem, toggleOutOfStock, refetch: fetchItems };
};
