
-- Fix orders: restrict read/update/delete to admin/staff
DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;

CREATE POLICY "Staff can read orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'super') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Super can delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super'));

-- Fix plc_sessions: remove public policies, keep admin-only; edge functions use service_role which bypasses RLS
DROP POLICY IF EXISTS "Anyone can read plc sessions" ON public.plc_sessions;
DROP POLICY IF EXISTS "Anyone can insert plc sessions" ON public.plc_sessions;
DROP POLICY IF EXISTS "Anyone can update plc sessions" ON public.plc_sessions;
DROP POLICY IF EXISTS "Anyone can delete plc sessions" ON public.plc_sessions;

CREATE POLICY "Staff can read plc sessions" ON public.plc_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Super can manage plc sessions" ON public.plc_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super'))
  WITH CHECK (public.has_role(auth.uid(), 'super'));

-- Scope menu_categories write policies to authenticated
DROP POLICY IF EXISTS "Super admins can insert categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Super admins can update categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Super admins can delete categories" ON public.menu_categories;
CREATE POLICY "Super admins can insert categories" ON public.menu_categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can update categories" ON public.menu_categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can delete categories" ON public.menu_categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super'));

-- Scope app_settings write policies to authenticated
DROP POLICY IF EXISTS "Super admins can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins can update settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins can delete settings" ON public.app_settings;
CREATE POLICY "Super admins can insert settings" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can update settings" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can delete settings" ON public.app_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super'));

-- Storage: require super role for menu-images upload/delete
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;
CREATE POLICY "Super admins can upload menu images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'super'));
CREATE POLICY "Super admins can delete menu images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'super'));

-- Lock down exec_sql: only service_role may execute
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
