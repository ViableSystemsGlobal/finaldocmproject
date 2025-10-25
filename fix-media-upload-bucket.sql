-- Fix uploadmedia bucket for video uploads
-- Run this in your Supabase SQL Editor

-- Create/update the uploadmedia bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploadmedia', 'uploadmedia', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Clean up existing policies
DROP POLICY IF EXISTS "Allow public access to uploadmedia objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own media" ON storage.objects;
DROP POLICY IF EXISTS "public_access_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_uploadmedia" ON storage.objects;

-- Create permissive policies for development
CREATE POLICY "Allow everyone to read uploadmedia"
ON storage.objects
FOR SELECT
TO authenticated, anon, service_role
USING (bucket_id = 'uploadmedia');

CREATE POLICY "Allow authenticated users to upload to uploadmedia"
ON storage.objects
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'uploadmedia');

CREATE POLICY "Allow authenticated users to update uploadmedia"
ON storage.objects
FOR UPDATE
TO authenticated, anon, service_role
USING (bucket_id = 'uploadmedia');

CREATE POLICY "Allow authenticated users to delete uploadmedia"
ON storage.objects
FOR DELETE
TO authenticated, anon, service_role
USING (bucket_id = 'uploadmedia');

-- Grant all privileges
GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role;

-- Set existing objects to be owned by authenticated
UPDATE storage.objects
SET owner = 'authenticated'
WHERE bucket_id = 'uploadmedia';

-- Show bucket status
SELECT id, name, public, owner, created_at
FROM storage.buckets
WHERE id = 'uploadmedia'; 