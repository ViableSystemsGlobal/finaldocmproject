-- Migration: Add department support for users in enhanced RBAC
-- Since we cannot modify auth.users directly, we'll use user metadata
-- This migration creates helper functions to manage user departments

-- Create a function to update user department in metadata
CREATE OR REPLACE FUNCTION update_user_department(user_id UUID, new_department TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Update user metadata to include department
  -- This will be handled by the application layer using Supabase Auth Admin API
  -- For now, we just validate the department value
  
  IF new_department IS NOT NULL AND new_department NOT IN (
    'pastoral_care', 'outreach', 'follow_up', 'prayer', 'youth', 
    'worship', 'children', 'discipleship', 'communications', 
    'finance', 'events', 'admin'
  ) THEN
    RAISE EXCEPTION 'Invalid department: %', new_department;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create a function to get users by department
-- This will query the auth.users table and filter by user_metadata
CREATE OR REPLACE FUNCTION get_users_by_department(dept_name TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT 
    id,
    email,
    COALESCE((raw_user_meta_data->>'department')::TEXT, 'none') as department,
    created_at
  FROM auth.users 
  WHERE (
    dept_name IS NULL 
    OR COALESCE((raw_user_meta_data->>'department')::TEXT, 'none') = dept_name
  )
  AND deleted_at IS NULL
  ORDER BY email;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_department(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_department(TEXT) TO authenticated;

-- Create a view for easier user department management
CREATE OR REPLACE VIEW user_departments AS
SELECT 
  id,
  email,
  COALESCE((raw_user_meta_data->>'department')::TEXT, 'none') as department,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON user_departments TO authenticated; 