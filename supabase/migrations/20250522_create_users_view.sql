-- Create a view of auth.users in the public schema for queries
DROP VIEW IF EXISTS users;

CREATE OR REPLACE VIEW users AS
  SELECT id, email, raw_user_meta_data FROM auth.users;

-- Add foreign key constraint to follow_ups table conditionally
DO $$
BEGIN
    -- Only modify follow_ups table if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
        -- If the previous constraint already exists, drop it first
        ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS fk_follow_ups_assigned_to;

        -- Add the foreign key constraint directly to auth.users
        ALTER TABLE follow_ups
          ADD CONSTRAINT fk_follow_ups_assigned_to
          FOREIGN KEY (assigned_to) 
          REFERENCES auth.users(id)
          ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If foreign key creation fails, skip it to avoid breaking the migration
        NULL;
END
$$; 