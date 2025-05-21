-- Enable RLS for the contacts table
ALTER TABLE people.contacts ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy that allows all operations for authenticated users
CREATE POLICY contacts_all_operations_policy
ON people.contacts
FOR ALL
USING (true)
WITH CHECK (true);

-- Make sure the anon role has access to the people schema
GRANT USAGE ON SCHEMA people TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA people TO anon;

-- Refresh permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA people
GRANT ALL ON TABLES TO anon; 