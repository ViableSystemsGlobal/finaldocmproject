-- First create the timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create campuses table
CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- ministry, small_group, discipleship
  campus_id UUID REFERENCES campuses(id),
  custom_fields JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create group_memberships table
CREATE TABLE IF NOT EXISTS group_memberships (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (group_id, contact_id)
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_campus_id ON groups(campus_id);
CREATE INDEX IF NOT EXISTS idx_memberships_contact_id ON group_memberships(contact_id);

-- Add triggers for updated_at
CREATE TRIGGER set_groups_updated_at
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_campuses_updated_at
BEFORE UPDATE ON campuses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Create function to count total members across all groups
CREATE OR REPLACE FUNCTION get_total_group_members_count()
RETURNS TABLE (count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT contact_id) FROM group_memberships;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users on groups"
ON groups
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on group_memberships"
ON group_memberships
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on campuses"
ON campuses
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO campuses (name, address) 
VALUES 
  ('Main Campus', '123 Church St, City, State'),
  ('North Campus', '456 Faith Ave, City, State'),
  ('South Campus', '789 Worship Blvd, City, State')
ON CONFLICT DO NOTHING; 