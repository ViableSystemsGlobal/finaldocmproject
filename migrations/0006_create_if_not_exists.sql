-- Create the contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  phone text,
  email text,
  profile_image text,
  tenant_id uuid,
  campus_id uuid,
  lifecycle text DEFAULT 'soul',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.members (
  contact_id uuid PRIMARY KEY REFERENCES public.contacts(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add a default tenant
INSERT INTO public.tenants (id, name)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Default Tenant')
ON CONFLICT (id) DO NOTHING;

-- Create index for members joined_at
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON public.members(joined_at);

-- Create function for counting members serving (placeholder for now)
CREATE OR REPLACE FUNCTION count_members_serving() RETURNS INTEGER AS $$
  SELECT 0;
$$ LANGUAGE SQL;

-- Create function for counting member app users (placeholder for now)
CREATE OR REPLACE FUNCTION count_member_app_users() RETURNS INTEGER AS $$
  SELECT 0;
$$ LANGUAGE SQL; 