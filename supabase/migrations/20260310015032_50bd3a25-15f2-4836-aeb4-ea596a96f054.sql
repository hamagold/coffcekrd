
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS out_of_stock boolean NOT NULL DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sub_cat text NOT NULL DEFAULT '';
