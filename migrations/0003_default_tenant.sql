-- Create a tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add a default tenant for easier development
INSERT INTO public.tenants (id, name, created_at, updated_at)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Default Tenant', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Modify the contacts table to set a default tenant_id
ALTER TABLE people.contacts
ALTER COLUMN tenant_id SET DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 