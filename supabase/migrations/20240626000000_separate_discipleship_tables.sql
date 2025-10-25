-- Migration to separate Discipleship Groups from Ministries & Groups
-- This creates dedicated tables for discipleship functionality

-- Create the updated_at timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create discipleship_groups table conditionally
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'discipleship_groups') THEN
        CREATE TABLE discipleship_groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          leader_id UUID, -- Will add foreign key constraint later if contacts table exists
          campus_id UUID,
          status TEXT NOT NULL DEFAULT 'active',
          meeting_schedule TEXT,
          meeting_location TEXT,
          age_group TEXT,
          curriculum TEXT,
          max_capacity INTEGER,
          custom_fields JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Create discipleship_memberships table
        CREATE TABLE discipleship_memberships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          discipleship_group_id UUID NOT NULL REFERENCES discipleship_groups(id) ON DELETE CASCADE,
          contact_id UUID NOT NULL, -- Will add foreign key constraint later if contacts table exists
          role TEXT NOT NULL DEFAULT 'mentee', -- mentee, mentor, co-leader
          joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          status TEXT NOT NULL DEFAULT 'active', -- active, inactive, graduated
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(discipleship_group_id, contact_id)
        );

        -- Create indexes for performance
        CREATE INDEX idx_discipleship_groups_status ON discipleship_groups(status);
        CREATE INDEX idx_discipleship_groups_leader_id ON discipleship_groups(leader_id);
        CREATE INDEX idx_discipleship_groups_campus_id ON discipleship_groups(campus_id);
        CREATE INDEX idx_discipleship_memberships_group_id ON discipleship_memberships(discipleship_group_id);
        CREATE INDEX idx_discipleship_memberships_contact_id ON discipleship_memberships(contact_id);
        CREATE INDEX idx_discipleship_memberships_status ON discipleship_memberships(status);

        -- Add triggers for updated_at
        CREATE TRIGGER set_discipleship_groups_updated_at
          BEFORE UPDATE ON discipleship_groups
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at_timestamp();

        CREATE TRIGGER set_discipleship_memberships_updated_at
          BEFORE UPDATE ON discipleship_memberships
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at_timestamp();

        -- Enable RLS
        ALTER TABLE discipleship_groups ENABLE ROW LEVEL SECURITY;
        ALTER TABLE discipleship_memberships ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies (shortened names to avoid truncation)
        CREATE POLICY "discipleship_groups_all_access"
        ON discipleship_groups
        TO authenticated
        USING (true)
        WITH CHECK (true);

        CREATE POLICY "discipleship_memberships_all_access"
        ON discipleship_memberships
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;

    -- Add foreign key constraints if contacts table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        -- Add leader foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'discipleship_groups_leader_id_fkey' 
            AND table_name = 'discipleship_groups'
        ) THEN
            ALTER TABLE discipleship_groups 
            ADD CONSTRAINT discipleship_groups_leader_id_fkey 
            FOREIGN KEY (leader_id) REFERENCES contacts(id);
        END IF;

        -- Add membership contact foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'discipleship_memberships_contact_id_fkey' 
            AND table_name = 'discipleship_memberships'
        ) THEN
            ALTER TABLE discipleship_memberships 
            ADD CONSTRAINT discipleship_memberships_contact_id_fkey 
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Migrate existing discipleship data from groups table if both tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'groups') 
       AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'group_memberships') THEN
        
        -- Check if there's data to migrate
        IF EXISTS (SELECT 1 FROM groups WHERE type = 'Discipleship') THEN
            -- Migrate existing discipleship data from groups table
            INSERT INTO discipleship_groups (
              id, name, status, leader_id, campus_id, custom_fields, created_at, updated_at
            )
            SELECT 
              id,
              name,
              status,
              leader_id,
              campus_id,
              custom_fields,
              created_at,
              updated_at
            FROM groups 
            WHERE type = 'Discipleship'
            ON CONFLICT (id) DO NOTHING; -- Avoid duplicates if already migrated

            -- Check if group_memberships has created_at column
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'group_memberships' AND column_name = 'created_at'
            ) THEN
                -- Migrate with created_at column
                INSERT INTO discipleship_memberships (
                  discipleship_group_id, contact_id, role, joined_at, created_at
                )
                SELECT 
                  gm.group_id,
                  gm.contact_id,
                  CASE 
                    WHEN gm.role IN ('Leader', 'Mentor') THEN 'mentor'
                    WHEN gm.role = 'Co-Leader' THEN 'co-leader'
                    ELSE 'mentee'
                  END as role,
                  gm.joined_at,
                  gm.created_at
                FROM group_memberships gm
                INNER JOIN groups g ON gm.group_id = g.id
                WHERE g.type = 'Discipleship'
                ON CONFLICT (discipleship_group_id, contact_id) DO NOTHING;
            ELSE
                -- Migrate without created_at column (use joined_at as fallback)
                INSERT INTO discipleship_memberships (
                  discipleship_group_id, contact_id, role, joined_at, created_at
                )
                SELECT 
                  gm.group_id,
                  gm.contact_id,
                  CASE 
                    WHEN gm.role IN ('Leader', 'Mentor') THEN 'mentor'
                    WHEN gm.role = 'Co-Leader' THEN 'co-leader'
                    ELSE 'mentee'
                  END as role,
                  gm.joined_at,
                  gm.joined_at as created_at -- Use joined_at as fallback for created_at
                FROM group_memberships gm
                INNER JOIN groups g ON gm.group_id = g.id
                WHERE g.type = 'Discipleship'
                ON CONFLICT (discipleship_group_id, contact_id) DO NOTHING;
            END IF;

            -- Remove discipleship data from groups table (now that it's been migrated)
            DELETE FROM group_memberships 
            WHERE group_id IN (SELECT id FROM groups WHERE type = 'Discipleship');

            DELETE FROM groups WHERE type = 'Discipleship';
        END IF;
    END IF;
END
$$;

-- Create helper functions for discipleship groups
CREATE OR REPLACE FUNCTION get_discipleship_group_member_count(group_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM discipleship_memberships
    WHERE discipleship_group_id = group_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get discipleship groups with member count
CREATE OR REPLACE FUNCTION get_discipleship_groups_with_counts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  leader_id UUID,
  campus_id UUID,
  status TEXT,
  meeting_schedule TEXT,
  meeting_location TEXT,
  age_group TEXT,
  curriculum TEXT,
  max_capacity INTEGER,
  custom_fields JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dg.id,
    dg.name,
    dg.description,
    dg.leader_id,
    dg.campus_id,
    dg.status,
    dg.meeting_schedule,
    dg.meeting_location,
    dg.age_group,
    dg.curriculum,
    dg.max_capacity,
    dg.custom_fields,
    dg.created_at,
    dg.updated_at,
    COUNT(dm.id) as member_count
  FROM discipleship_groups dg
  LEFT JOIN discipleship_memberships dm ON dg.id = dm.discipleship_group_id AND dm.status = 'active'
  GROUP BY dg.id, dg.name, dg.description, dg.leader_id, dg.campus_id, dg.status, 
           dg.meeting_schedule, dg.meeting_location, dg.age_group, dg.curriculum, 
           dg.max_capacity, dg.custom_fields, dg.created_at, dg.updated_at
  ORDER BY dg.name;
END;
$$ LANGUAGE plpgsql; 