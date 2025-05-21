-- Create members table
CREATE TABLE IF NOT EXISTS people.members (
  contact_id UUID PRIMARY KEY REFERENCES people.contacts(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add profile_image column to contacts if it doesn't exist
ALTER TABLE people.contacts 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create groups table for church groups
CREATE TABLE IF NOT EXISTS people.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  campus_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_memberships table for tracking who is in which group
CREATE TABLE IF NOT EXISTS people.group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES people.groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES people.contacts(id) ON DELETE CASCADE,
  role TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, contact_id)
);

-- Create mobile_app_users table
CREATE TABLE IF NOT EXISTS people.mobile_app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES people.contacts(id) ON DELETE CASCADE,
  device_token TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id)
);

-- Create functions for metrics
CREATE OR REPLACE FUNCTION count_members_serving() RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT contact_id) FROM people.group_memberships 
  WHERE contact_id IN (SELECT contact_id FROM people.members)
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION count_member_app_users() RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT contact_id) FROM people.mobile_app_users 
  WHERE contact_id IN (SELECT contact_id FROM people.members)
$$ LANGUAGE SQL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON people.members(joined_at);
CREATE INDEX IF NOT EXISTS idx_group_memberships_contact_id ON people.group_memberships(contact_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON people.group_memberships(group_id); 