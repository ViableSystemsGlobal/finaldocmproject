-- Create the follow_ups table if it doesn't exist
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_action_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- If the previous constraint already exists, drop it first
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS fk_follow_ups_assigned_to;

-- Add the foreign key constraint directly to auth.users
ALTER TABLE follow_ups
  ADD CONSTRAINT fk_follow_ups_assigned_to
  FOREIGN KEY (assigned_to) 
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Keep the users view for querying purposes
DROP VIEW IF EXISTS users;

CREATE OR REPLACE VIEW users AS
  SELECT id, email, raw_user_meta_data FROM auth.users; 