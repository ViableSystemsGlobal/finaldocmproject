-- Simplified and robust contact dependency checking function
-- Run this in your Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION check_contact_dependencies(p_contact_id UUID)
RETURNS TABLE (
  dependency_category TEXT,
  dependency_count BIGINT,
  dependency_details JSONB
) AS $$
BEGIN
  -- Check group memberships (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_memberships') THEN
    RETURN QUERY
    SELECT 
      'group_memberships' as dependency_category,
      COUNT(*) as dependency_count,
      jsonb_agg(
        jsonb_build_object(
          'group_id', gm.group_id,
          'group_name', COALESCE(g.name, 'Unknown Group'),
          'group_type', COALESCE(g.type, 'ministry'),
          'role', COALESCE(gm.role, 'member')
        )
      ) as dependency_details
    FROM group_memberships gm
    LEFT JOIN groups g ON gm.group_id = g.id
    WHERE gm.contact_id = p_contact_id
    GROUP BY 1
    HAVING COUNT(*) > 0;
  END IF;

  -- Check discipleship group memberships (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discipleship_memberships') THEN
    RETURN QUERY
    SELECT 
      'discipleship_memberships' as dependency_category,
      COUNT(*) as dependency_count,
      jsonb_agg(
        jsonb_build_object(
          'group_id', dm.discipleship_group_id,
          'group_name', COALESCE(dg.name, 'Unknown Discipleship Group'),
          'role', COALESCE(dm.role, 'member'),
          'status', COALESCE(dm.status, 'active')
        )
      ) as dependency_details
    FROM discipleship_memberships dm
    LEFT JOIN discipleship_groups dg ON dm.discipleship_group_id = dg.id
    WHERE dm.contact_id = p_contact_id 
      AND COALESCE(dm.status, 'active') = 'active'
    GROUP BY 1
    HAVING COUNT(*) > 0;
  END IF;

  -- Check groups where contact is leader (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups') THEN
    RETURN QUERY
    SELECT 
      'groups_led' as dependency_category,
      COUNT(*) as dependency_count,
      jsonb_agg(
        jsonb_build_object(
          'group_id', g.id,
          'group_name', g.name,
          'group_type', COALESCE(g.type, 'ministry')
        )
      ) as dependency_details
    FROM groups g
    WHERE g.leader_id = p_contact_id
    GROUP BY 1
    HAVING COUNT(*) > 0;
  END IF;

  -- Check discipleship groups where contact is leader (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discipleship_groups') THEN
    RETURN QUERY
    SELECT 
      'discipleship_groups_led' as dependency_category,
      COUNT(*) as dependency_count,
      jsonb_agg(
        jsonb_build_object(
          'group_id', dg.id,
          'group_name', dg.name
        )
      ) as dependency_details
    FROM discipleship_groups dg
    WHERE dg.leader_id = p_contact_id
    GROUP BY 1
    HAVING COUNT(*) > 0;
  END IF;

  -- Check member record (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
    RETURN QUERY
    SELECT 
      'member_record' as dependency_category,
      COUNT(*) as dependency_count,
      jsonb_agg(
        jsonb_build_object(
          'joined_at', m.joined_at,
          'status', COALESCE(m.status, 'active')
        )
      ) as dependency_details
    FROM members m
    WHERE m.contact_id = p_contact_id
    GROUP BY 1
    HAVING COUNT(*) > 0;
  END IF;

  -- Check follow-ups (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follow_ups') THEN
    RETURN QUERY
    SELECT 
      'pending_follow_ups' as dependency_category,
      COUNT(*) as dependency_count,
      jsonb_agg(
        jsonb_build_object(
          'id', fu.id,
          'type', COALESCE(fu.type, 'general'),
          'status', COALESCE(fu.status, 'pending'),
          'due_date', fu.due_date
        )
      ) as dependency_details
    FROM follow_ups fu
    WHERE fu.contact_id = p_contact_id 
      AND COALESCE(fu.status, 'pending') != 'completed'
    GROUP BY 1
    HAVING COUNT(*) > 0;
  END IF;

  -- Check event attendance (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_attendance') THEN
    RETURN QUERY
    SELECT 
      'event_attendance' as dependency_category,
      COUNT(*) as dependency_count,
      jsonb_build_object('total_events', COUNT(*)) as dependency_details
    FROM event_attendance ea
    WHERE ea.contact_id = p_contact_id
    GROUP BY 1
    HAVING COUNT(*) > 0;
  END IF;

  -- Return empty result if no dependencies found
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM check_contact_dependencies('00000000-0000-0000-0000-000000000000'); 