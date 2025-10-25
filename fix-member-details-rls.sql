-- Fix RLS policies for member details tables
-- Run this in your Supabase Dashboard > SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can create follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can update follow_ups" ON public.follow_ups;

DROP POLICY IF EXISTS "Users can view events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update events" ON public.events;

DROP POLICY IF EXISTS "Users can view event_attendance" ON public.event_attendance;
DROP POLICY IF EXISTS "Users can create event_attendance" ON public.event_attendance;
DROP POLICY IF EXISTS "Users can update event_attendance" ON public.event_attendance;

DROP POLICY IF EXISTS "Users can view donations" ON public.donations;
DROP POLICY IF EXISTS "Users can create donations" ON public.donations;
DROP POLICY IF EXISTS "Users can update donations" ON public.donations;

DROP POLICY IF EXISTS "Users can view member_notes" ON public.member_notes;
DROP POLICY IF EXISTS "Users can create member_notes" ON public.member_notes;
DROP POLICY IF EXISTS "Users can update member_notes" ON public.member_notes;

-- Create more permissive policies that allow both anon and authenticated access
-- Follow-ups policies
CREATE POLICY "Allow all access to follow_ups" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);

-- Events policies  
CREATE POLICY "Allow all access to events" ON public.events FOR ALL USING (true) WITH CHECK (true);

-- Event attendance policies
CREATE POLICY "Allow all access to event_attendance" ON public.event_attendance FOR ALL USING (true) WITH CHECK (true);

-- Donations policies
CREATE POLICY "Allow all access to donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);

-- Member notes policies
CREATE POLICY "Allow all access to member_notes" ON public.member_notes FOR ALL USING (true) WITH CHECK (true);

-- Also ensure the tables have proper grants
GRANT ALL ON public.follow_ups TO anon, authenticated, service_role;
GRANT ALL ON public.events TO anon, authenticated, service_role;
GRANT ALL ON public.event_attendance TO anon, authenticated, service_role;
GRANT ALL ON public.donations TO anon, authenticated, service_role;
GRANT ALL ON public.member_notes TO anon, authenticated, service_role;

-- Grant usage on sequences if they exist
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

SELECT 'RLS policies fixed for member details tables!' AS status; 