
-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow public read
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');
