-- Migration: Add department field to roles table for enhanced RBAC
-- This supports the department-based role assignment system

-- Add department column to roles table
ALTER TABLE roles 
ADD COLUMN department TEXT;

-- Add comment for documentation
COMMENT ON COLUMN roles.department IS 'Department assignment for the role (pastoral_care, outreach, follow_up, prayer, youth, worship, children, discipleship, communications, finance, events, admin)';

-- Update existing roles to have no department (they will be assigned later)
-- This ensures backward compatibility

-- Optional: Create an index for faster department-based queries
CREATE INDEX IF NOT EXISTS idx_roles_department ON roles(department);

-- Create a function to get roles by department
CREATE OR REPLACE FUNCTION get_roles_by_department(dept_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  department TEXT,
  permissions JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT 
    id, 
    name, 
    description, 
    department, 
    permissions, 
    is_active, 
    created_at, 
    updated_at
  FROM roles 
  WHERE (dept_name IS NULL OR department = dept_name)
  AND is_active = true
  ORDER BY name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_roles_by_department(TEXT) TO authenticated; 