-- Modular Migration: Supabase Storage Bucket & RLS Policies
-- File: supabase/migrations/20260830000000_storage_setup.sql

-- 1. Create Public Storage Bucket 'portfolio-media'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-media',
  'portfolio-media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Storage RLS Policies for portfolio-media Bucket

-- Public Read Policy: Allow anyone to view images
CREATE POLICY "Public Read Media Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-media');

-- Authenticated Upload Policy: Allow authenticated users/admins to upload images
CREATE POLICY "Authenticated Upload Media Assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND (auth.role() = 'authenticated' OR public.is_admin())
);

-- Authenticated Update Policy: Allow authenticated users/admins to update existing media
CREATE POLICY "Authenticated Update Media Assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-media'
  AND (auth.role() = 'authenticated' OR public.is_admin())
)
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND (auth.role() = 'authenticated' OR public.is_admin())
);

-- Authenticated Delete Policy: Allow authenticated users/admins to delete media
CREATE POLICY "Authenticated Delete Media Assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-media'
  AND (auth.role() = 'authenticated' OR public.is_admin())
);
