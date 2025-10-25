-- Fix storage bucket issues with admin privileges
-- This MUST be run as the postgres/admin user in Supabase SQL Editor

-- First, temporarily disable RLS on buckets table to allow creation
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Create/update the uploadmedia bucket (this will now work without RLS issues)
INSERT INTO storage.buckets (id, name, public, owner, created_at, updated_at)
VALUES (
    'uploadmedia', 
    'uploadmedia', 
    true, 
    (SELECT auth.uid()),
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    updated_at = now();

-- Re-enable RLS on buckets table
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for buckets table (if they don't exist)
DROP POLICY IF EXISTS "Allow authenticated users to read buckets" ON storage.buckets;
CREATE POLICY "Allow authenticated users to read buckets"
ON storage.buckets
FOR SELECT
TO authenticated, anon
USING (true);

-- Now fix the objects table policies
-- Clean up existing policies
DROP POLICY IF EXISTS "Allow public access to uploadmedia objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own media" ON storage.objects;
DROP POLICY IF EXISTS "public_access_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_uploadmedia" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_uploadmedia" ON storage.objects;

-- Create comprehensive policies for the uploadmedia bucket
CREATE POLICY "uploadmedia_select_policy"
ON storage.objects
FOR SELECT
TO authenticated, anon, service_role
USING (bucket_id = 'uploadmedia');

CREATE POLICY "uploadmedia_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'uploadmedia');

CREATE POLICY "uploadmedia_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated, anon, service_role
USING (bucket_id = 'uploadmedia');

CREATE POLICY "uploadmedia_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated, anon, service_role
USING (bucket_id = 'uploadmedia');

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON storage.buckets TO authenticated, anon, service_role;

-- Set ownership of existing objects
UPDATE storage.objects
SET owner = 'authenticated'
WHERE bucket_id = 'uploadmedia';

-- Verify the bucket was created successfully
SELECT 
    id, 
    name, 
    public, 
    owner, 
    created_at,
    'SUCCESS: Bucket created/updated' as status
FROM storage.buckets
WHERE id = 'uploadmedia'

UNION ALL

SELECT 
    'N/A' as id,
    'ERROR' as name,
    false as public,
    NULL as owner,
    NULL as created_at,
    'FAILED: Bucket not found' as status
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploadmedia'); 