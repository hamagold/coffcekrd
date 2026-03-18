
CREATE TABLE public.menu_item_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  name_ku text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_item_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read variants" ON public.menu_item_variants FOR SELECT TO public USING (true);
CREATE POLICY "Super admins can insert variants" ON public.menu_item_variants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can update variants" ON public.menu_item_variants FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can delete variants" ON public.menu_item_variants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super'));
