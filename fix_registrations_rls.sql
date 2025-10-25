-- Fix RLS policies for registrations table to allow public event registrations
-- Run this in your Supabase SQL Editor

-- First, check if the registrations table exists and has RLS enabled
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "registrations_all_operations_policy" ON public.registrations;
DROP POLICY IF EXISTS "service_role_bypass_registrations" ON public.registrations;

-- Create new policies that allow public access for event registrations

-- 1. Allow anonymous users to INSERT registrations (for public event registration)
CREATE POLICY "allow_public_event_registration" ON public.registrations
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 2. Allow authenticated users to SELECT registrations (for admin viewing)
CREATE POLICY "allow_authenticated_read_registrations" ON public.registrations
FOR SELECT 
TO authenticated
USING (true);

-- 3. Allow authenticated users to UPDATE registrations (for admin management)
CREATE POLICY "allow_authenticated_update_registrations" ON public.registrations
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Allow authenticated users to DELETE registrations (for admin management)
CREATE POLICY "allow_authenticated_delete_registrations" ON public.registrations
FOR DELETE 
TO authenticated
USING (true);

-- 5. Service role bypass (for admin operations and API)
CREATE POLICY "service_role_bypass_registrations" ON public.registrations
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to anonymous role for registrations
GRANT INSERT ON public.registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;

-- Also ensure contacts table allows anonymous INSERT (for new contact creation during registration)
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "contacts_all_operations_policy" ON public.contacts;

-- Create policies for contacts table
CREATE POLICY "allow_public_contact_creation" ON public.contacts
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_read_contacts" ON public.contacts
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_update_contacts" ON public.contacts
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete_contacts" ON public.contacts
FOR DELETE 
TO authenticated
USING (true);

CREATE POLICY "service_role_bypass_contacts" ON public.contacts
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to anonymous role for contacts
GRANT INSERT ON public.contacts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'contacts')
ORDER BY tablename, policyname; 