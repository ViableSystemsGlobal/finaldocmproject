-- Create the soul_winning table if it doesn't exist
CREATE TABLE IF NOT EXISTS soul_winning (
  contact_id UUID PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
  saved BOOLEAN NOT NULL DEFAULT false,
  inviter_type TEXT NOT NULL,
  inviter_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  inviter_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_to TEXT DEFAULT NULL,
  converted_at TIMESTAMPTZ DEFAULT NULL
);

-- Add comments
COMMENT ON TABLE soul_winning IS 'Records of soul winning activities and salvation decisions';
COMMENT ON COLUMN soul_winning.contact_id IS 'ID of the contact who is the subject of soul winning';
COMMENT ON COLUMN soul_winning.saved IS 'Whether the person has made a salvation decision';
COMMENT ON COLUMN soul_winning.inviter_type IS 'Category of how the person was invited/connected';
COMMENT ON COLUMN soul_winning.inviter_contact_id IS 'ID of the contact who invited this person (if applicable)';
COMMENT ON COLUMN soul_winning.inviter_name IS 'Name of inviter if not a contact in the system';
COMMENT ON COLUMN soul_winning.converted_to IS 'Where the soul was converted to (visitor, member)';
COMMENT ON COLUMN soul_winning.converted_at IS 'When the soul was converted';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_soul_winning_saved ON soul_winning(saved);
CREATE INDEX IF NOT EXISTS idx_soul_winning_inviter_type ON soul_winning(inviter_type);
CREATE INDEX IF NOT EXISTS idx_soul_winning_converted_to ON soul_winning(converted_to);
