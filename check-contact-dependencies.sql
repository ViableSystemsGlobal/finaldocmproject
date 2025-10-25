-- SQL function to comprehensively check contact dependencies
-- Run this in your Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION check_contact_dependencies(p_contact_id UUID)
RETURNS TABLE (
  dependency_category TEXT,
  dependency_count BIGINT,
  dependency_details JSONB
) AS $$
BEGIN
  -- Check group memberships
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

  -- Check discipleship group memberships
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
    AND dm.status = 'active'
  GROUP BY 1
  HAVING COUNT(*) > 0;

  -- Check groups where contact is leader
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

  -- Check discipleship groups where contact is leader
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

  -- Check member record
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

  -- Check follow-ups (only pending ones)
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

  -- Check event attendance
  RETURN QUERY
  SELECT 
    'event_attendance' as dependency_category,
    COUNT(*) as dependency_count,
    jsonb_build_object('total_events', COUNT(*)) as dependency_details
  FROM event_attendance ea
  WHERE ea.contact_id = p_contact_id
  GROUP BY 1
  HAVING COUNT(*) > 0;

  -- Check soul winning records
  RETURN QUERY
  SELECT 
    'soul_winning_records' as dependency_category,
    COUNT(*) as dependency_count,
    jsonb_build_object('total_records', COUNT(*)) as dependency_details
  FROM soul_winning sw
  WHERE sw.contact_id = p_contact_id
  GROUP BY 1
  HAVING COUNT(*) > 0;

  -- Check prayer requests
  RETURN QUERY
  SELECT 
    'prayer_requests' as dependency_category,
    COUNT(*) as dependency_count,
    jsonb_build_object('total_requests', COUNT(*)) as dependency_details
  FROM prayer_requests pr
  WHERE pr.contact_id = p_contact_id
  GROUP BY 1
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql; 