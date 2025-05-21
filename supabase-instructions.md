# Fixing "must be owner" Error in Supabase

## Step 1: Access SQL Editor with Admin Privileges

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click the dropdown near the **New query** button
4. Select **New query with admin privileges**
5. This should connect you with the `postgres` role which has full admin rights

## Step 2: Run this simplified SQL

```sql
-- Make bucket public and fix permissions - simplified SQL
-- This must be run with admin privileges

-- First create/update the bucket as public
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create a simplified policy for anonymous access
-- This avoids touching RLS directly but still grants access
BEGIN;
  -- Remove any conflicting policies
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  
  -- Create simple full access policy
  CREATE POLICY "Public Access" 
  ON storage.objects
  FOR ALL
  USING (true) 
  WITH CHECK (true);
COMMIT;

-- Update ownership on existing files
UPDATE storage.objects
SET owner = 'authenticated'
WHERE bucket_id = 'profile-images';

-- Finally grant privileges
GRANT ALL ON storage.objects TO postgres, anon, authenticated, service_role;
GRANT ALL ON storage.buckets TO postgres, anon, authenticated, service_role;
```

If you still see errors after running this SQL with admin privileges, there might be a more fundamental issue with your Supabase setup. In that case, try using the client-side workaround in the code that prefixes files with "authenticated/" in the path.

## Alternative: Setup via Supabase UI

1. Go to **Storage** in the Supabase dashboard
2. Click **Create bucket**
3. Name it `profile-images`
4. Check **Public bucket**
5. Click **Create bucket**
6. Go to **Authentication > Policies**
7. Find the storage-related policies
8. Click on the policy for the storage.objects table
9. Choose "New policy from scratch"
10. Configure the most permissive option: "Allow full access for all users" 