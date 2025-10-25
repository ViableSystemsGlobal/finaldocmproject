-- Fix sermons table access for web app
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on sermons table (if not already enabled)
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow public read access to published sermons
DROP POLICY IF EXISTS "allow_public_read_published_sermons" ON public.sermons;
CREATE POLICY "allow_public_read_published_sermons" ON public.sermons
FOR SELECT 
TO public
USING (status = 'published');

-- 3. Allow authenticated users full access (for admin functionality)
DROP POLICY IF EXISTS "allow_authenticated_full_access_sermons" ON public.sermons;
CREATE POLICY "allow_authenticated_full_access_sermons" ON public.sermons
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Allow service role bypass (for API operations)
DROP POLICY IF EXISTS "allow_service_role_bypass_sermons" ON public.sermons;
CREATE POLICY "allow_service_role_bypass_sermons" ON public.sermons
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Test the policy by selecting published sermons
SELECT 
    'Policy test result' as info,
    id,
    title,
    speaker,
    status,
    sermon_date
FROM public.sermons 
WHERE status = 'published'
ORDER BY sermon_date DESC
LIMIT 3; 