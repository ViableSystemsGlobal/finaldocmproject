-- Fixed RLS policies for single-tenant church admin system
-- Run this in production (doesn't assume tenant_id column exists)

-- 1. Enable RLS on all tables
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Create simple, secure policies for single-tenant system

-- REGISTRATIONS: Allow authenticated users full access
DROP POLICY IF EXISTS "registrations_authenticated_policy" ON public.registrations;
CREATE POLICY "registrations_authenticated_policy" ON public.registrations
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- INVITATIONS: Allow authenticated users full access
DROP POLICY IF EXISTS "invitations_authenticated_policy" ON public.invitations;
CREATE POLICY "invitations_authenticated_policy" ON public.invitations
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- EVENTS: Allow authenticated users full access
DROP POLICY IF EXISTS "events_authenticated_policy" ON public.events;
CREATE POLICY "events_authenticated_policy" ON public.events
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- EVENT_IMAGES: Allow authenticated users full access
DROP POLICY IF EXISTS "event_images_authenticated_policy" ON public.event_images;
CREATE POLICY "event_images_authenticated_policy" ON public.event_images
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_contact_id ON public.registrations(contact_id);
CREATE INDEX IF NOT EXISTS idx_invitations_event_id ON public.invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_contact_id ON public.invitations(recipient_contact_id);
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON public.event_images(event_id);

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;

-- 5. Service role bypass (for admin operations and API calls)
DROP POLICY IF EXISTS "service_role_bypass_registrations" ON public.registrations;
CREATE POLICY "service_role_bypass_registrations" ON public.registrations
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_invitations" ON public.invitations;
CREATE POLICY "service_role_bypass_invitations" ON public.invitations
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_events" ON public.events;
CREATE POLICY "service_role_bypass_events" ON public.events
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_event_images" ON public.event_images;
CREATE POLICY "service_role_bypass_event_images" ON public.event_images
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Confirm policies are working
SELECT 
    tablename,
    policyname,
    'Policy created successfully' as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'invitations', 'events', 'event_images')
ORDER BY tablename, policyname; 