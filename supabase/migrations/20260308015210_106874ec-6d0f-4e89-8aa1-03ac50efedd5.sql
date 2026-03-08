
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  cat text NOT NULL DEFAULT 'hot',
  emoji text NOT NULL DEFAULT '☕',
  name_ku text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  desc_ku text NOT NULL DEFAULT '',
  desc_ar text NOT NULL DEFAULT '',
  desc_en text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  image text,
  menu_type text NOT NULL DEFAULT 'robot',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read menu items (for POS and online order)
CREATE POLICY "Anyone can read menu items" ON public.menu_items FOR SELECT USING (true);

-- Only super admins can manage menu items
CREATE POLICY "Super admins can insert menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can update menu items" ON public.menu_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can delete menu items" ON public.menu_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super'));
