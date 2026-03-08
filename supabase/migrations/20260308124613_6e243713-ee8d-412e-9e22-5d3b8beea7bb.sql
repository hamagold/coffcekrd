
CREATE TABLE public.menu_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cat_id text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '📦',
  name_ku text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  menu_type text NOT NULL DEFAULT 'robot',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Super admins can insert categories" ON public.menu_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'super'::app_role));
CREATE POLICY "Super admins can update categories" ON public.menu_categories FOR UPDATE USING (has_role(auth.uid(), 'super'::app_role));
CREATE POLICY "Super admins can delete categories" ON public.menu_categories FOR DELETE USING (has_role(auth.uid(), 'super'::app_role));

-- Seed default categories
INSERT INTO public.menu_categories (cat_id, icon, name_ku, name_ar, name_en, menu_type, sort_order) VALUES
  ('hot', '🔥', 'گەرم', 'ساخن', 'Hot', 'robot', 0),
  ('cold', '❄️', 'سارد', 'بارد', 'Cold', 'robot', 1),
  ('shake', '🧋', 'شێک', 'شيك', 'Shake', 'robot', 2),
  ('juice', '🍹', 'ئاو میوە', 'عصير', 'Juice', 'robot', 3),
  ('sandwich', '🌯', 'ساندویچ', 'ساندويتش', 'Sandwiches', 'staff', 0),
  ('food', '🍖', 'خواردن', 'طعام', 'Food', 'staff', 1),
  ('dessert', '🧁', 'شیرینی', 'حلويات', 'Desserts', 'staff', 2),
  ('salad', '🥬', 'سەلاتە', 'سلطة', 'Salads', 'staff', 3);
