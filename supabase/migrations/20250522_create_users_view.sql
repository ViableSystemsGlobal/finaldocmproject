-- Create a view of auth.users in the public schema for queries
DROP VIEW IF EXISTS users;

CREATE OR REPLACE VIEW users AS
  SELECT id, email, raw_user_meta_data FROM auth.users;

-- If the previous constraint already exists, drop it first
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS fk_follow_ups_assigned_to;

-- Add the foreign key constraint directly to auth.users
ALTER TABLE follow_ups
  ADD CONSTRAINT fk_follow_ups_assigned_to
  FOREIGN KEY (assigned_to) 
  REFERENCES auth.users(id)
  ON DELETE SET NULL; 