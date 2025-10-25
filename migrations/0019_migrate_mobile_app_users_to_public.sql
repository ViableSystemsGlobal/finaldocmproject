-- Migration 0019: Ensure mobile_app_users is properly set up in public schema
-- This migration ensures consistency with the rest of the schema using public instead of people

-- Create mobile_app_users table in public schema if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mobile_app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  devices JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on contact_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'mobile_app_users_contact_id_unique' 
    AND table_name = 'mobile_app_users'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.mobile_app_users ADD CONSTRAINT mobile_app_users_contact_id_unique UNIQUE (contact_id);
  END IF;
END $$;

-- Migrate data from people schema if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'people' AND table_name = 'mobile_app_users') THEN
    -- Copy data from people.mobile_app_users to public.mobile_app_users
    INSERT INTO public.mobile_app_users (contact_id, registered_at, last_active, status, devices, created_at, updated_at)
    SELECT 
      p.contact_id, 
      p.created_at as registered_at,
      p.last_login_at as last_active,
      'active' as status,
      COALESCE(
        CASE 
          WHEN p.device_token IS NOT NULL AND p.device_token != '' 
          THEN jsonb_build_array(jsonb_build_object(
            'device_id', gen_random_uuid()::text,
            'device_name', 'Unknown Device',
            'platform', 'unknown',
            'push_token', p.device_token,
            'last_used', p.last_login_at
          ))
          ELSE '[]'::jsonb
        END,
        '[]'::jsonb
      ) as devices,
      p.created_at,
      p.updated_at
    FROM people.mobile_app_users p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.mobile_app_users pub 
      WHERE pub.contact_id = p.contact_id
    );
    
    RAISE NOTICE 'Migrated data from people.mobile_app_users to public.mobile_app_users';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mobile_app_users_contact_id ON public.mobile_app_users(contact_id);
CREATE INDEX IF NOT EXISTS idx_mobile_app_users_status ON public.mobile_app_users(status);
CREATE INDEX IF NOT EXISTS idx_mobile_app_users_last_active ON public.mobile_app_users(last_active);

-- Enable RLS
ALTER TABLE public.mobile_app_users ENABLE ROW LEVEL SECURITY;

-- Drop old policies and create new ones
DROP POLICY IF EXISTS "Allow all operations on mobile app users" ON public.mobile_app_users;
DROP POLICY IF EXISTS "mobile_app_users_all_operations_policy" ON public.mobile_app_users;

-- Create comprehensive RLS policies
CREATE POLICY "Allow all operations on mobile app users" ON public.mobile_app_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mobile_app_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mobile_app_users_updated_at ON public.mobile_app_users;
CREATE TRIGGER update_mobile_app_users_updated_at
BEFORE UPDATE ON public.mobile_app_users
FOR EACH ROW EXECUTE PROCEDURE update_mobile_app_users_updated_at();

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_member_app_status(UUID);

-- Update the RPC function to prioritize public schema
CREATE OR REPLACE FUNCTION get_member_app_status(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  status TEXT,
  devices JSONB
) AS $$
BEGIN
  -- Check public schema first (prioritized)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mobile_app_users') THEN
    RETURN QUERY
    SELECT 
      mau.id, 
      mau.created_at, 
      mau.last_active as last_login_at,
      mau.registered_at,
      mau.last_active,
      mau.status,
      mau.devices
    FROM public.mobile_app_users mau
    WHERE mau.contact_id = p_contact_id;
  -- Fall back to people schema (legacy)
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'people' AND table_name = 'mobile_app_users') THEN
    RETURN QUERY
    SELECT 
      mau.id, 
      mau.created_at, 
      mau.last_login_at,
      mau.created_at as registered_at,
      mau.last_login_at as last_active,
      'active'::TEXT as status,
      '[]'::jsonb as devices
    FROM people.mobile_app_users mau
    WHERE mau.contact_id = p_contact_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.mobile_app_users TO authenticated, anon, service_role;

-- Optional: Drop the old people.mobile_app_users table if it exists and we've migrated the data
-- Uncomment the following lines if you want to remove the old table:
-- DROP TABLE IF EXISTS people.mobile_app_users CASCADE;

SELECT 'Mobile app users table successfully set up in public schema' as status; 