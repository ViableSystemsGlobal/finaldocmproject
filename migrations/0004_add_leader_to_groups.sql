-- Add leader_id to groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES contacts(id);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON groups(leader_id);

-- Add comment explaining the field
COMMENT ON COLUMN groups.leader_id IS 'UUID of the contact who leads this group'; 