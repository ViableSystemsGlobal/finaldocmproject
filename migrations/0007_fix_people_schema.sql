-- Make sure the people schema exists
CREATE SCHEMA IF NOT EXISTS people;

-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA people TO anon, authenticated;
GRANT USAGE ON SCHEMA people TO service_role;

-- Grant all privileges on all tables in schema people to anon and authenticated roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA people TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA people TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA people 
GRANT ALL PRIVILEGES ON TABLES TO anon, authenticated, service_role;

-- Disable RLS for development (for simplicity)
ALTER TABLE IF EXISTS people.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS people.members DISABLE ROW LEVEL SECURITY;

-- Create or replace the custom functions for metrics in the people schema
CREATE OR REPLACE FUNCTION count_members_serving() RETURNS INTEGER AS $$
  SELECT 0;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION count_member_app_users() RETURNS INTEGER AS $$
  SELECT 0;
$$ LANGUAGE SQL; 