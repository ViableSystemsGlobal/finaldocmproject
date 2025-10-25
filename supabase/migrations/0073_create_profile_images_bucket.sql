-- Create profile-images storage bucket for mobile app profile pictures
-- This bucket will store user profile images uploaded from the mobile app

-- Create the profile-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public access to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete profile images" ON storage.objects;

-- Create comprehensive policies for the profile-images bucket
-- Allow everyone to read/view profile images (public access)
CREATE POLICY "Allow public access to profile-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload profile images
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to update their own profile images
CREATE POLICY "Allow authenticated users to update profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images');

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Allow authenticated users to delete profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Verify the bucket was created
SELECT id, name, public, owner, created_at
FROM storage.buckets
WHERE id = 'profile-images'; 