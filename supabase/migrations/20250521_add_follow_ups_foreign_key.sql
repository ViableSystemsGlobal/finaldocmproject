-- Step 1: First, check if there's a users table in the public schema we can reference
-- If not, we create a foreign key to auth.users directly or through a view

-- Option A: Directly reference auth.users if your Supabase configuration allows it
ALTER TABLE follow_ups
  ADD CONSTRAINT fk_follow_ups_assigned_to
  FOREIGN KEY (assigned_to) 
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

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