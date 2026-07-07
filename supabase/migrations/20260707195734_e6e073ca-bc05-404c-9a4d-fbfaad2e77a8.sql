
-- Remove broad SELECT storage policy that allows listing files in the public menu-images bucket.
-- Public buckets still serve direct file URLs without an RLS SELECT policy.
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;

-- Lock internal helper functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon, authenticated;
