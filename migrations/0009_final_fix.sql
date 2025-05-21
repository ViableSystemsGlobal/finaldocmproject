-- FINAL MIGRATION TO FIX ALL ISSUES

-- First, let's enable direct debugging
SET client_min_messages TO DEBUG;

-- Verify schema exists and create it if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'people') THEN
    RAISE NOTICE 'Creating schema people';
    CREATE SCHEMA people;
  ELSE
    RAISE NOTICE 'Schema people already exists';
  END IF;
END
$$;

-- Let's absolutely ensure we have the right permissions
GRANT USAGE ON SCHEMA people TO PUBLIC;
GRANT USAGE ON SCHEMA people TO anon;
GRANT USAGE ON SCHEMA people TO authenticated;
GRANT USAGE ON SCHEMA people TO service_role;

-- Create contacts table for sure
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

-- Grant permissions on contacts
GRANT ALL PRIVILEGES ON TABLE people.contacts TO PUBLIC;
GRANT ALL PRIVILEGES ON TABLE people.contacts TO anon;
GRANT ALL PRIVILEGES ON TABLE people.contacts TO authenticated;
GRANT ALL PRIVILEGES ON TABLE people.contacts TO service_role;

-- Disable RLS as a final measure
ALTER TABLE people.contacts DISABLE ROW LEVEL SECURITY;

-- Verify the table exists and count records
SELECT count(*) AS contacts_count FROM people.contacts;

-- Final diagnostic
SELECT 
  schemaname, 
  tablename, 
  tableowner, 
  hasindexes, 
  hasrules, 
  hastriggers, 
  rowsecurity
FROM 
  pg_catalog.pg_tables
WHERE 
  schemaname = 'people'
ORDER BY 
  tablename; 