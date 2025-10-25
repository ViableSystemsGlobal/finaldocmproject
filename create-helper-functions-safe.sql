-- Helper functions for member details queries (SAFE VERSION)
-- These functions help query data regardless of schema location and handle separated group types

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_member_group_memberships(UUID);
DROP FUNCTION IF EXISTS get_member_discipleship_memberships(UUID);
DROP FUNCTION IF EXISTS get_member_all_group_memberships(UUID);
DROP FUNCTION IF EXISTS get_member_info(UUID);

-- Function to get member group memberships (ministries & groups only)
CREATE OR REPLACE FUNCTION get_member_group_memberships(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  groups JSON
) AS $$
DECLARE
  has_created_at BOOLEAN;
BEGIN
  -- Try people schema first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'people' AND table_name = 'group_memberships') THEN
    -- Check if created_at column exists in people schema
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'people' AND table_name = 'group_memberships' AND column_name = 'created_at'
    ) INTO has_created_at;
    
    IF has_created_at THEN
      RETURN QUERY
      SELECT 
        gm.id,
        gm.role,
        gm.joined_at,
        gm.created_at,
        json_build_object(
          'id', g.id,
          'name', g.name,
          'description', g.description,
          'type', g.type
        ) as groups
      FROM people.group_memberships gm
      LEFT JOIN people.groups g ON gm.group_id = g.id
      WHERE gm.contact_id = p_contact_id
      ORDER BY gm.joined_at DESC NULLS LAST;
    ELSE
      RETURN QUERY
      SELECT 
        gm.id,
        gm.role,
        gm.joined_at,
        gm.joined_at as created_at, -- Use joined_at as fallback
        json_build_object(
          'id', g.id,
          'name', g.name,
          'description', g.description,
          'type', g.type
        ) as groups
      FROM people.group_memberships gm
      LEFT JOIN people.groups g ON gm.group_id = g.id
      WHERE gm.contact_id = p_contact_id
      ORDER BY gm.joined_at DESC NULLS LAST;
    END IF;
  -- Fall back to public schema
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_memberships') THEN
    -- Check if created_at column exists in public schema
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'group_memberships' AND column_name = 'created_at'
    ) INTO has_created_at;
    
    IF has_created_at THEN
      RETURN QUERY
      SELECT 
        gm.id,
        gm.role,
        gm.joined_at,
        gm.created_at,
        json_build_object(
          'id', g.id,
          'name', g.name,
          'description', g.description,
          'type', g.type
        ) as groups
      FROM public.group_memberships gm
      LEFT JOIN public.groups g ON gm.group_id = g.id
      WHERE gm.contact_id = p_contact_id
      ORDER BY gm.joined_at DESC NULLS LAST;
    ELSE
      RETURN QUERY
      SELECT 
        gm.id,
        gm.role,
        gm.joined_at,
        gm.joined_at as created_at, -- Use joined_at as fallback
        json_build_object(
          'id', g.id,
          'name', g.name,
          'description', g.description,
          'type', g.type
        ) as groups
      FROM public.group_memberships gm
      LEFT JOIN public.groups g ON gm.group_id = g.id
      WHERE gm.contact_id = p_contact_id
      ORDER BY gm.joined_at DESC NULLS LAST;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get member discipleship group memberships
CREATE OR REPLACE FUNCTION get_member_discipleship_memberships(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  groups JSON
) AS $$
BEGIN
  -- Check if discipleship_memberships table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discipleship_memberships') THEN
    RETURN QUERY
    SELECT 
      dm.id,
      dm.role,
      dm.joined_at,
      dm.created_at,
      json_build_object(
        'id', dg.id,
        'name', dg.name,
        'description', dg.description,
        'type', 'discipleship'
      ) as groups
    FROM discipleship_memberships dm
    LEFT JOIN discipleship_groups dg ON dm.discipleship_group_id = dg.id
    WHERE dm.contact_id = p_contact_id AND dm.status = 'active'
    ORDER BY dm.joined_at DESC NULLS LAST;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get ALL member group memberships (both ministries and discipleship)
CREATE OR REPLACE FUNCTION get_member_all_group_memberships(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  groups JSON
) AS $$
BEGIN
  -- Return ministry/groups memberships
  RETURN QUERY
  SELECT * FROM get_member_group_memberships(p_contact_id);
  
  -- Return discipleship memberships
  RETURN QUERY
  SELECT * FROM get_member_discipleship_memberships(p_contact_id);
END;
$$ LANGUAGE plpgsql;

-- Function to get member info (for member details)
CREATE OR REPLACE FUNCTION get_member_info(p_contact_id UUID)
RETURNS TABLE (
  contact_id UUID,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  status TEXT,
  notes TEXT
) AS $$
BEGIN
  -- Try people schema first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'people' AND table_name = 'members') THEN
    RETURN QUERY
    SELECT 
      m.contact_id,
      m.joined_at,
      m.created_at,
      'active'::TEXT as status,
      m.notes
    FROM people.members m
    WHERE m.contact_id = p_contact_id;
  -- Fall back to public schema
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'members') THEN
    RETURN QUERY
    SELECT 
      m.contact_id,
      m.joined_at,
      m.created_at,
      COALESCE(m.status, 'active') as status,
      m.notes
    FROM public.members m
    WHERE m.contact_id = p_contact_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_member_group_memberships TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_member_discipleship_memberships TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_member_all_group_memberships TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_member_info TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Member details helper functions created successfully!' AS status; 