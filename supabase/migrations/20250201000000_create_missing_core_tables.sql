-- Create missing core tables and functions for groups and membership functionality

-- Create groups table (ministries and groups)
CREATE TABLE IF NOT EXISTS public.groups (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  description     text,
  type            text        default 'ministry',  -- ministry, small_group, committee, etc
  status          text        default 'active',    -- active, inactive
  campus_id       uuid,
  leader_id       uuid,
  meeting_schedule text,
  capacity        int,
  custom_fields   jsonb       default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Create group_memberships table
CREATE TABLE IF NOT EXISTS public.group_memberships (
  id              uuid        primary key default gen_random_uuid(),
  group_id        uuid        not null references public.groups(id) on delete cascade,
  contact_id      uuid        not null,
  role            text        default 'Member',     -- Member, Leader, Co-Leader, etc
  status          text        default 'active',     -- active, inactive
  joined_at       timestamptz default now(),
  created_at      timestamptz default now(),
  
  -- Ensure unique membership per person per group
  unique(group_id, contact_id)
);

-- Create members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.members (
  id              uuid        primary key default gen_random_uuid(),
  contact_id      uuid        unique not null,
  joined_at       timestamptz default now(),
  status          text        default 'active',     -- active, inactive
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Create mobile_app_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mobile_app_users (
  id              uuid        primary key default gen_random_uuid(),
  contact_id      uuid        unique not null,
  device_id       text,
  app_version     text,
  platform        text,       -- ios, android
  push_token      text,
  last_login_at   timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_app_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for groups
CREATE POLICY "Groups are viewable by everyone" ON public.groups
  FOR SELECT USING (true);

CREATE POLICY "Groups are manageable by admins" ON public.groups
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for group_memberships
CREATE POLICY "Group memberships are viewable by everyone" ON public.group_memberships
  FOR SELECT USING (true);

CREATE POLICY "Group memberships are manageable by admins" ON public.group_memberships
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for members
CREATE POLICY "Members are viewable by everyone" ON public.members
  FOR SELECT USING (true);

CREATE POLICY "Members are manageable by admins" ON public.members
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for mobile_app_users
CREATE POLICY "App users are viewable by everyone" ON public.mobile_app_users
  FOR SELECT USING (true);

CREATE POLICY "App users are manageable by admins" ON public.mobile_app_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_type ON public.groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_campus_id ON public.groups(campus_id);
CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON public.groups(leader_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON public.group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_contact_id ON public.group_memberships(contact_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON public.group_memberships(status);

CREATE INDEX IF NOT EXISTS idx_members_contact_id ON public.members(contact_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);

CREATE INDEX IF NOT EXISTS idx_mobile_app_users_contact_id ON public.mobile_app_users(contact_id);

-- Create function to get discipleship groups metrics
CREATE OR REPLACE FUNCTION public.get_discipleship_groups_metrics()
RETURNS TABLE (
  total_groups bigint,
  active_groups bigint,
  total_disciples bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT count(*) FROM discipleship_groups), 0) as total_groups,
    COALESCE((SELECT count(*) FROM discipleship_groups WHERE status = 'active'), 0) as active_groups,
    COALESCE((SELECT count(*) FROM discipleship_memberships WHERE status = 'active'), 0) as total_disciples;
END;
$$ LANGUAGE plpgsql;

-- Create function to get total group members count
CREATE OR REPLACE FUNCTION public.get_total_group_members_count()
RETURNS TABLE (
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE((SELECT count(*) FROM group_memberships WHERE status = 'active'), 0) as count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get groups count
CREATE OR REPLACE FUNCTION public.get_groups_count()
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE((SELECT count(*) FROM groups), 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get active groups count  
CREATE OR REPLACE FUNCTION public.get_active_groups_count()
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE((SELECT count(*) FROM groups WHERE status = 'active'), 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get members count
CREATE OR REPLACE FUNCTION public.get_members_count()
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE((SELECT count(*) FROM members WHERE status = 'active'), 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get new members this month
CREATE OR REPLACE FUNCTION public.get_new_members_this_month()
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE((
    SELECT count(*) 
    FROM members 
    WHERE status = 'active' 
    AND date_trunc('month', joined_at) = date_trunc('month', current_date)
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get members serving count (have group memberships)
CREATE OR REPLACE FUNCTION public.get_members_serving()
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE((
    SELECT count(DISTINCT gm.contact_id) 
    FROM group_memberships gm
    INNER JOIN members m ON m.contact_id = gm.contact_id
    WHERE gm.status = 'active' AND m.status = 'active'
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get member app users count
CREATE OR REPLACE FUNCTION public.get_member_app_users()
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE((
    SELECT count(DISTINCT mau.contact_id)
    FROM mobile_app_users mau
    INNER JOIN members m ON m.contact_id = mau.contact_id
    WHERE m.status = 'active'
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Add some sample data to test the functionality
DO $$
BEGIN
  -- Add a sample group if no groups exist
  IF NOT EXISTS (SELECT 1 FROM groups LIMIT 1) THEN
    INSERT INTO groups (name, description, type, status) VALUES
    ('Worship Team', 'Leading worship during services', 'ministry', 'active'),
    ('Youth Ministry', 'Ministry to teenagers and young adults', 'ministry', 'active'),
    ('Prayer Team', 'Intercession and prayer ministry', 'ministry', 'active');
  END IF;
  
  -- Add sample members if no members exist  
  IF NOT EXISTS (SELECT 1 FROM members LIMIT 1) THEN
    INSERT INTO members (contact_id, joined_at, status) VALUES
    (gen_random_uuid(), current_date - interval '6 months', 'active'),
    (gen_random_uuid(), current_date - interval '1 year', 'active'),
    (gen_random_uuid(), current_date - interval '2 months', 'active');
  END IF;
END $$; 