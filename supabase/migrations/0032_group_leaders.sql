-- Migration: Add Group Leader System
-- This migration creates tables and functionality for group leaders with permissions

-- Create group_leaders table
CREATE TABLE IF NOT EXISTS group_leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    is_primary_leader BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create group_permissions table for flexible permission management
CREATE TABLE IF NOT EXISTS group_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL, -- 'approve_requests', 'send_messages', 'edit_group', 'add_members', 'remove_members', 'view_analytics'
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, permission_type)
);

-- Add columns to groups table for leader management
ALTER TABLE groups ADD COLUMN IF NOT EXISTS auto_assign_creator_as_leader BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS requires_leader_approval BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_leaders_group_id ON group_leaders(group_id);
CREATE INDEX IF NOT EXISTS idx_group_leaders_user_id ON group_leaders(user_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_group_id ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_type ON group_permissions(permission_type);

-- Create function to initialize default permissions for a group
CREATE OR REPLACE FUNCTION initialize_group_permissions(group_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO group_permissions (group_id, permission_type, is_enabled)
    VALUES 
        (group_id, 'approve_requests', true),
        (group_id, 'send_messages', true),
        (group_id, 'edit_group', true),
        (group_id, 'add_members', true),
        (group_id, 'remove_members', true),
        (group_id, 'view_analytics', true)
    ON CONFLICT (group_id, permission_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create function to assign a user as group leader
CREATE OR REPLACE FUNCTION assign_group_leader(
    p_group_id UUID,
    p_user_id UUID,
    p_assigned_by UUID DEFAULT NULL,
    p_is_primary BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    leader_id UUID;
BEGIN
    -- Insert the leader record
    INSERT INTO group_leaders (group_id, user_id, assigned_by, is_primary_leader)
    VALUES (p_group_id, p_user_id, p_assigned_by, p_is_primary)
    ON CONFLICT (group_id, user_id) 
    DO UPDATE SET 
        is_primary_leader = p_is_primary,
        updated_at = NOW()
    RETURNING id INTO leader_id;
    
    -- Initialize group permissions if they don't exist
    PERFORM initialize_group_permissions(p_group_id);
    
    RETURN leader_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user is a group leader
CREATE OR REPLACE FUNCTION is_group_leader(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_leaders 
        WHERE user_id = p_user_id AND group_id = p_group_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has specific permission for a group
CREATE OR REPLACE FUNCTION has_group_permission(
    p_user_id UUID, 
    p_group_id UUID, 
    p_permission_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is a group leader and the permission is enabled
    RETURN EXISTS (
        SELECT 1 
        FROM group_leaders gl
        JOIN group_permissions gp ON gl.group_id = gp.group_id
        WHERE gl.user_id = p_user_id 
        AND gl.group_id = p_group_id
        AND gp.permission_type = p_permission_type
        AND gp.is_enabled = true
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign creator as leader when creating groups
CREATE OR REPLACE FUNCTION auto_assign_group_creator_as_leader()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-assign if the flag is enabled
    IF NEW.auto_assign_creator_as_leader = true AND NEW.created_by IS NOT NULL THEN
        PERFORM assign_group_leader(
            NEW.id,
            NEW.created_by,
            NEW.created_by,
            true -- is_primary_leader
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on groups table
DROP TRIGGER IF EXISTS trigger_auto_assign_group_leader ON groups;
CREATE TRIGGER trigger_auto_assign_group_leader
    AFTER INSERT ON groups
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_group_creator_as_leader();

-- Create view for easy querying of group leaders with user info
CREATE OR REPLACE VIEW group_leaders_view AS
SELECT 
    gl.id,
    gl.group_id,
    gl.user_id,
    gl.assigned_at,
    gl.assigned_by,
    gl.is_primary_leader,
    g.name as group_name,
    g.description as group_description,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    up.avatar_url
FROM group_leaders gl
JOIN groups g ON gl.group_id = g.id
JOIN user_profiles up ON gl.user_id = up.user_id;

-- Create view for group permissions summary
CREATE OR REPLACE VIEW group_permissions_summary AS
SELECT 
    gp.group_id,
    g.name as group_name,
    jsonb_object_agg(gp.permission_type, gp.is_enabled) as permissions
FROM group_permissions gp
JOIN groups g ON gp.group_id = g.id
GROUP BY gp.group_id, g.name;

-- Initialize permissions for existing groups
DO $$
DECLARE
    group_record RECORD;
BEGIN
    FOR group_record IN SELECT id FROM groups LOOP
        PERFORM initialize_group_permissions(group_record.id);
    END LOOP;
END $$;

-- Grant necessary permissions for RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON group_leaders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON group_permissions TO authenticated;
GRANT SELECT ON group_leaders_view TO authenticated;
GRANT SELECT ON group_permissions_summary TO authenticated;

-- Enable RLS
ALTER TABLE group_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for group_leaders
CREATE POLICY "Users can view group leaders for groups they have access to" ON group_leaders
    FOR SELECT USING (
        -- Super admins can see all
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin')
        OR
        -- Group leaders can see other leaders of their groups
        EXISTS (SELECT 1 FROM group_leaders gl2 WHERE gl2.user_id = auth.uid() AND gl2.group_id = group_leaders.group_id)
        OR
        -- Users can see leaders of groups they're members of
        EXISTS (SELECT 1 FROM group_memberships gm WHERE gm.contact_id = auth.uid() AND gm.group_id = group_leaders.group_id)
    );

CREATE POLICY "Super admins can manage group leaders" ON group_leaders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Primary leaders can assign other leaders" ON group_leaders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_leaders gl 
            WHERE gl.user_id = auth.uid() 
            AND gl.group_id = group_leaders.group_id 
            AND gl.is_primary_leader = true
        )
        OR
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin')
    );

-- Create RLS policies for group_permissions
CREATE POLICY "Users can view permissions for groups they lead" ON group_permissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin')
        OR
        EXISTS (SELECT 1 FROM group_leaders gl WHERE gl.user_id = auth.uid() AND gl.group_id = group_permissions.group_id)
    );

CREATE POLICY "Super admins can manage group permissions" ON group_permissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin')
    );

-- Add helpful comments
COMMENT ON TABLE group_leaders IS 'Tracks which users are leaders of which groups';
COMMENT ON TABLE group_permissions IS 'Stores permission configurations for group leaders';
COMMENT ON FUNCTION assign_group_leader(UUID, UUID, UUID, BOOLEAN) IS 'Assigns a user as a group leader with optional primary status';
COMMENT ON FUNCTION has_group_permission(UUID, UUID, VARCHAR) IS 'Checks if a user has a specific permission for a group';
COMMENT ON FUNCTION is_group_leader(UUID, UUID) IS 'Checks if a user is a leader of a specific group'; 