-- COPY AND PASTE THIS ENTIRE SCRIPT INTO THE SUPABASE SQL EDITOR
-- This script fixes the "must be owner" error for storage

-- First completely disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Clean up any existing policies (drops them if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to select from profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to update and delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow download from profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual insert access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual update access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete access" ON storage.objects;

-- Create a completely permissive policy
CREATE POLICY "Allow everything for everyone"
ON storage.objects
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- Create or update the profile-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO 
  UPDATE SET public = true;

-- Grant all privileges on storage.objects
GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role;

-- Set existing objects in profile-images bucket to be owned by authenticated
UPDATE storage.objects
SET owner = 'authenticated'
WHERE bucket_id = 'profile-images';

-- Show if RLS is enabled for storage.objects
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM 
  pg_catalog.pg_tables
WHERE 
  schemaname = 'storage'
  AND tablename = 'objects';

-- Show existing storage buckets
SELECT id, name, public, owner
FROM storage.buckets
ORDER BY name; 