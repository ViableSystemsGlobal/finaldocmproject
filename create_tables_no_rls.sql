-- Create tables without RLS for development
-- Run this in your Supabase SQL Editor

-- 1. Create registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create invitations table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  recipient_contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'email',
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create event_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DISABLE RLS for development (easier to work with)
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images DISABLE ROW LEVEL SECURITY;

-- 5. Drop any existing policies (in case they're causing issues)
DROP POLICY IF EXISTS "registrations_all_operations_policy" ON public.registrations;
DROP POLICY IF EXISTS "invitations_all_operations_policy" ON public.invitations;
DROP POLICY IF EXISTS "event_images_all_operations_policy" ON public.event_images;

-- 6. Grant permissions to all roles
GRANT ALL ON public.registrations TO authenticated, anon, service_role;
GRANT ALL ON public.invitations TO authenticated, anon, service_role;
GRANT ALL ON public.event_images TO authenticated, anon, service_role;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_contact_id ON public.registrations(contact_id);
CREATE INDEX IF NOT EXISTS idx_invitations_event_id ON public.invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_contact_id ON public.invitations(recipient_contact_id);
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON public.event_images(event_id);

-- 8. Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Add updated_at triggers
DROP TRIGGER IF EXISTS set_registrations_updated_at ON public.registrations;
CREATE TRIGGER set_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

-- 10. Test the tables by inserting some sample data (optional)
-- Uncomment the following lines to test:

-- INSERT INTO public.registrations (event_id, contact_id, status) 
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'confirmed')
-- ON CONFLICT DO NOTHING;

-- 11. Verify tables were created and are accessible
SELECT 
    'Table created successfully: ' || tablename as status,
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'invitations', 'event_images')
ORDER BY tablename; 