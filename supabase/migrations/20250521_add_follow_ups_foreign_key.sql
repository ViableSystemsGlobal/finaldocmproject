-- Step 1: First, check if there's a users table in the public schema we can reference
-- If not, we create a foreign key to auth.users directly or through a view

-- Add foreign key constraint to follow_ups table conditionally
DO $$
BEGIN
    -- Only add constraint if follow_ups table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
        -- Check if the constraint doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_follow_ups_assigned_to' 
            AND table_name = 'follow_ups'
        ) THEN
            -- Try to add foreign key to auth.users
            ALTER TABLE follow_ups
              ADD CONSTRAINT fk_follow_ups_assigned_to
              FOREIGN KEY (assigned_to) 
              REFERENCES auth.users(id)
              ON DELETE SET NULL;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If foreign key to auth.users fails, we can create a view as fallback
        -- For now, we'll just skip the constraint to avoid breaking the migration
        NULL;
END
$$;

-- Option B: If your setup doesn't allow cross-schema references, create a view of users in public schema first
-- Uncomment these lines if Option A fails

-- CREATE OR REPLACE VIEW users AS
--   SELECT id, email, raw_user_meta_data FROM auth.users;
--
-- ALTER TABLE follow_ups
--   ADD CONSTRAINT fk_follow_ups_assigned_to
--   FOREIGN KEY (assigned_to) 
--   REFERENCES users(id)
--   ON DELETE SET NULL; 