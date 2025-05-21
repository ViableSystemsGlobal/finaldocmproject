-- Move tables from people schema to public schema

-- First, create the tables in public schema if they don't exist
CREATE TABLE IF NOT EXISTS public.contacts (LIKE people.contacts INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.members (LIKE people.members INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.tenants (LIKE people.tenants INCLUDING ALL);

-- Copy data from people schema to public schema
INSERT INTO public.contacts 
SELECT * FROM people.contacts
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenants
SELECT * FROM people.tenants
ON CONFLICT (id) DO NOTHING;

-- Add default tenant if needed
INSERT INTO public.tenants (id, name)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Default Tenant')
ON CONFLICT (id) DO NOTHING;

-- Fix the members foreign key to point to public.contacts
ALTER TABLE public.members 
DROP CONSTRAINT IF EXISTS members_contact_id_fkey,
ADD CONSTRAINT members_contact_id_fkey 
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Disable RLS for development
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- Verify the tables exist and have data
SELECT count(*) AS contacts_count FROM public.contacts;
SELECT count(*) AS tenants_count FROM public.tenants;

-- Show final table structure
SELECT 
  schemaname, 
  tablename, 
  tableowner
FROM 
  pg_catalog.pg_tables
WHERE 
  schemaname = 'public' AND
  tablename IN ('contacts', 'members', 'tenants')
ORDER BY 
  tablename; 