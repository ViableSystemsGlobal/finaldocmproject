-- Drop the tables in public schema if they exist (to avoid confusion)
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Create contacts table in people schema
CREATE TABLE IF NOT EXISTS people.contacts (
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

-- Create members table in people schema
CREATE TABLE IF NOT EXISTS people.members (
  contact_id uuid PRIMARY KEY REFERENCES people.contacts(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tenants table in people schema
CREATE TABLE IF NOT EXISTS people.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add a default tenant
INSERT INTO people.tenants (id, name)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Default Tenant')
ON CONFLICT (id) DO NOTHING;

-- Create index for members joined_at
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON people.members(joined_at);

-- Verify tables exist
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'people' 
ORDER BY table_schema, table_name; 