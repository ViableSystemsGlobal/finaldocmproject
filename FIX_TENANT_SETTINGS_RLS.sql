-- Fix RLS policies for tenant_settings to allow public website access
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read tenant settings" ON public.tenant_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update tenant settings" ON public.tenant_settings;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tenant_settings;

-- Create new policies that allow public read access (for website)
-- but only authenticated users can update (for admin)

-- Allow EVERYONE (including anonymous/public) to read tenant settings
CREATE POLICY "Allow public read access to tenant settings" ON public.tenant_settings
  FOR SELECT USING (true);

-- Only authenticated users can update
CREATE POLICY "Allow authenticated users to update tenant settings" ON public.tenant_settings
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can insert
CREATE POLICY "Allow authenticated users to insert tenant settings" ON public.tenant_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can delete
CREATE POLICY "Allow authenticated users to delete tenant settings" ON public.tenant_settings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'tenant_settings'
ORDER BY policyname;

