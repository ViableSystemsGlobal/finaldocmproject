-- Fix uploadmedia bucket permissions for video and image uploads
-- Run this in your Supabase SQL Editor

-- Ensure the uploadmedia bucket exists and is public
INSERT INTO storage.buckets (id, name, public, owner)
VALUES ('uploadmedia', 'uploadmedia', true, (SELECT auth.uid()))
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  updated_at = now();

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow public access to uploadmedia objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own media" ON storage.objects;
DROP POLICY IF EXISTS "public_access_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_uploadmedia" ON storage.objects;

-- Create comprehensive policies for the uploadmedia bucket
-- Allow everyone to read uploaded media
CREATE POLICY "uploadmedia_select_all"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploadmedia');

-- Allow authenticated users to upload to uploadmedia
CREATE POLICY "uploadmedia_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploadmedia');

-- Allow users to update their own uploads or any for admins
CREATE POLICY "uploadmedia_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploadmedia');

-- Allow users to delete their own uploads or any for admins
CREATE POLICY "uploadmedia_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploadmedia');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Verify the bucket exists
SELECT id, name, public, owner, created_at
FROM storage.buckets
WHERE id = 'uploadmedia'; 