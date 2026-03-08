
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Super admins can insert settings" ON public.app_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'super'::app_role));
CREATE POLICY "Super admins can update settings" ON public.app_settings FOR UPDATE USING (has_role(auth.uid(), 'super'::app_role));
CREATE POLICY "Super admins can delete settings" ON public.app_settings FOR DELETE USING (has_role(auth.uid(), 'super'::app_role));

-- Seed default storage setting
INSERT INTO public.app_settings (key, value) VALUES ('storage_config', '{"storageType": "lovable-cloud", "r2Config": {"accountId": "", "accessKeyId": "", "secretAccessKey": "", "bucketName": "", "publicDomain": ""}}'::jsonb);
