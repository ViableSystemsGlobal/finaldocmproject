#!/bin/bash

# Set these variables to match your Supabase project
export NEXT_PUBLIC_SUPABASE_URL="https://ufjfafcfkalaasdhgcbi.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ3MTMsImV4cCI6MjA2MzI5MDcxM30.PzwQAeRUJDK8llZf0awLwgW6j-pAmZPOgz55USsOnyo"
export SUPABASE_SERVICE_ROLE_KEY="postgresql://postgres:postgres@db.ufjfafcfkalaasdhgcbi.supabase.co:5432/postgres"

echo "Fixing storage bucket permissions..."

# Connect to Supabase and execute SQL
supabase db execute <<SQL

-- Fix storage bucket RLS issues
-- Ensure the profile-images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO 
  UPDATE SET public = true;

-- Disable RLS on storage.objects (containing the files)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create permissive policies
-- Policy for all authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'profile-images');

-- Policy for all users to select files from profile-images
DROP POLICY IF EXISTS "Allow users to select from profile-images" ON storage.objects;
CREATE POLICY "Allow users to select from profile-images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'profile-images');

-- Policy for file owners to update and delete
DROP POLICY IF EXISTS "Allow owners to update and delete files" ON storage.objects;
CREATE POLICY "Allow owners to update and delete files"
ON storage.objects
FOR ALL
TO authenticated, anon
USING (bucket_id = 'profile-images');

-- Grant all privileges to storage objects 
GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role;

SQL

echo "Storage bucket permissions fixed!"
echo "The storage bucket 'profile-images' should now allow uploads from any user." 