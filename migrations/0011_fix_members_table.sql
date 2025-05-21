-- Fix members table issues
SET client_min_messages TO NOTICE;

-- Make sure people schema exists
CREATE SCHEMA IF NOT EXISTS people;

-- Make sure members table exists in public schema
CREATE TABLE IF NOT EXISTS public.members (
  contact_id uuid PRIMARY KEY REFERENCES public.contacts(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Make sure members table exists in people schema
CREATE TABLE IF NOT EXISTS people.members (
  contact_id uuid PRIMARY KEY REFERENCES people.contacts(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS on both tables to simplify development
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE people.members DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to anon and authenticated roles (both schemas)
GRANT ALL PRIVILEGES ON TABLE public.members TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE people.members TO anon, authenticated, service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_joined_at_public ON public.members(joined_at);
CREATE INDEX IF NOT EXISTS idx_members_joined_at_people ON people.members(joined_at);

-- Diagnose the current table state
SELECT table_schema, table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'members' 
ORDER BY table_schema;

-- Check foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'members'
ORDER BY tc.table_schema; 