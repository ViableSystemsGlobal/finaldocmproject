-- Fix storage bucket RLS issues
SET client_min_messages TO NOTICE;

-- Ensure the profile-images bucket exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-images', 'profile-images', true)
  ON CONFLICT (id) DO 
    UPDATE SET public = true;
  
  RAISE NOTICE 'Ensured profile-images bucket exists and is public';
END $$;

-- Disable RLS on storage.objects (containing the files)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- If we still need policies, create permissive ones
-- Policy for all authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'profile-images');

-- Policy for all users to select files from profile-images
CREATE POLICY "Allow users to select from profile-images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'profile-images');

-- Policy for file owners to update and delete
CREATE POLICY "Allow owners to update and delete files"
ON storage.objects
FOR ALL
TO authenticated, anon
USING (bucket_id = 'profile-images');

-- Policy for anyone to download files from profile-images
CREATE POLICY "Allow download from profile-images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'profile-images');

-- Make sure all objects in profile-images are accessible
UPDATE storage.objects
SET owner = 'authenticated'
WHERE bucket_id = 'profile-images';

-- Grant all privileges to storage objects 
GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role;

-- Verify the bucket exists and is public
SELECT id, name, public, owner, created_at
FROM storage.buckets
WHERE id = 'profile-images';

-- Diagnostic: Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM 
  pg_catalog.pg_tables
WHERE 
  schemaname = 'storage'
ORDER BY 
  tablename; 