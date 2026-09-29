-- ====================================================================
-- 004_coaching_storage.sql
-- Storage buckets + storage.objects policies for the coaching platform.
-- Idempotent — safe to run more than once.
-- ====================================================================

-- ---------------------------------------------------------------- 1. BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('institute-assets', 'institute-assets', true),
  ('course-images', 'course-images', true),
  ('course-brochures', 'course-brochures', true),
  ('faculty-photos', 'faculty-photos', true),
  ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ---------------------------------------------------------------- 2. READ POLICIES (public content buckets)
DROP POLICY IF EXISTS "Public read institute-assets" ON storage.objects;
CREATE POLICY "Public read institute-assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images'));

-- ---------------------------------------------------------------- 3. WRITE POLICIES (authenticated + permission gated)
-- No service-role key is ever required for ordinary uploads: the signed-in
-- user's own session writes through RLS on storage.objects.
DROP POLICY IF EXISTS "Storage upload permission" ON storage.objects;
CREATE POLICY "Storage upload permission"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.upload')
  );

DROP POLICY IF EXISTS "Storage update permission" ON storage.objects;
CREATE POLICY "Storage update permission"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.upload')
  )
  WITH CHECK (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.upload')
  );

DROP POLICY IF EXISTS "Storage delete permission" ON storage.objects;
CREATE POLICY "Storage delete permission"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.delete')
  );
