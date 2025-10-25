-- Production-ready RLS policies for scale
-- Run this in production after development is complete

-- 1. Enable RLS on all tables
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Create secure, scalable policies

-- REGISTRATIONS: Users can only see registrations for events they have access to
DROP POLICY IF EXISTS "registrations_tenant_policy" ON public.registrations;
CREATE POLICY "registrations_tenant_policy" ON public.registrations
FOR ALL 
TO authenticated
USING (
  -- Allow if user is authenticated and has access to the event
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = registrations.event_id
    AND (
      -- Admin users can see all
      auth.jwt() ->> 'role' = 'admin'
      OR
      -- Service role can see all  
      auth.jwt() ->> 'role' = 'service_role'
      OR
      -- Users can see events from their tenant
      e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
)
WITH CHECK (
  -- Same check for inserts/updates
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = registrations.event_id
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR auth.jwt() ->> 'role' = 'service_role'
      OR e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
);

-- INVITATIONS: Similar tenant-based access
DROP POLICY IF EXISTS "invitations_tenant_policy" ON public.invitations;
CREATE POLICY "invitations_tenant_policy" ON public.invitations
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = invitations.event_id
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR auth.jwt() ->> 'role' = 'service_role'
      OR e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = invitations.event_id
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR auth.jwt() ->> 'role' = 'service_role'
      OR e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
);

-- EVENTS: Tenant-based access
DROP POLICY IF EXISTS "events_tenant_policy" ON public.events;
CREATE POLICY "events_tenant_policy" ON public.events
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.jwt() ->> 'role' = 'service_role'
  OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.jwt() ->> 'role' = 'service_role'
  OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- EVENT_IMAGES: Access based on event access
DROP POLICY IF EXISTS "event_images_tenant_policy" ON public.event_images;
CREATE POLICY "event_images_tenant_policy" ON public.event_images
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_images.event_id
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR auth.jwt() ->> 'role' = 'service_role'
      OR e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_images.event_id
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR auth.jwt() ->> 'role' = 'service_role'
      OR e.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  )
);

-- 3. Create performance indexes for RLS policies
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON public.events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_tenant ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_event_tenant ON public.invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_event_tenant ON public.event_images(event_id);

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;

-- 5. Service role bypass (for admin operations)
CREATE POLICY "service_role_bypass_registrations" ON public.registrations
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_bypass_invitations" ON public.invitations
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_bypass_events" ON public.events
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_bypass_event_images" ON public.event_images
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true); 