-- =====================
-- Multi-App User Management System
-- Database Schema Setup
-- =====================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('mobile_user', 'admin_staff', 'hybrid')),
  app_access TEXT[] NOT NULL DEFAULT ARRAY['mobile'],
  
  -- Basic Info
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Admin-specific fields
  department TEXT,
  job_title TEXT,
  employee_id TEXT,
  hire_date DATE,
  
  -- Mobile user linking
  member_id UUID, -- Link to members table (if exists)
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  preferences JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  UNIQUE(employee_id) -- If present, must be unique
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_app_access ON user_profiles USING GIN(app_access);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_member_id ON user_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- RLS Policies for user_profiles
-- =====================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id = OLD.user_id -- Prevent changing user_id
  AND user_type = OLD.user_type -- Prevent changing user_type
  AND app_access = OLD.app_access -- Prevent changing app_access
);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access"
ON user_profiles FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Admin users can read all profiles
CREATE POLICY "Admin users can read all profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.permissions ? 'administration:view:all'
  )
);

-- Policy: Admin users can manage profiles
CREATE POLICY "Admin users can manage profiles"
ON user_profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.permissions ? 'administration:manage:all'
  )
);

-- =====================
-- Database Functions
-- =====================

-- Function to create user profile automatically when auth user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id,
    user_type,
    app_access,
    first_name,
    last_name,
    is_active,
    is_verified
  ) VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'user_type', 'mobile_user'),
    CASE 
      WHEN NEW.user_metadata->>'user_type' = 'admin_staff' THEN ARRAY['admin']
      WHEN NEW.user_metadata->>'user_type' = 'hybrid' THEN ARRAY['mobile', 'admin']
      ELSE ARRAY['mobile']
    END,
    NEW.user_metadata->>'first_name',
    NEW.user_metadata->>'last_name',
    TRUE,
    CASE 
      WHEN NEW.user_metadata->>'user_type' = 'admin_staff' THEN TRUE
      ELSE FALSE 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to update user profile when auth user is updated
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  old_last_sign_in TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Safely get the old last_sign_in_at value
  old_last_sign_in := COALESCE(OLD.last_sign_in_at, '1970-01-01'::TIMESTAMP WITH TIME ZONE);
  
  -- Update profile when user metadata changes
  UPDATE user_profiles
  SET
    first_name = NEW.user_metadata->>'first_name',
    last_name = NEW.user_metadata->>'last_name',
    user_type = COALESCE(NEW.user_metadata->>'user_type', user_type),
    last_login_at = CASE 
      WHEN NEW.last_sign_in_at IS NOT NULL AND NEW.last_sign_in_at > old_last_sign_in
      THEN NEW.last_sign_in_at 
      ELSE last_login_at 
    END,
    updated_at = NOW()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, just update basic fields
    UPDATE user_profiles
    SET
      first_name = NEW.user_metadata->>'first_name',
      last_name = NEW.user_metadata->>'last_name',
      user_type = COALESCE(NEW.user_metadata->>'user_type', user_type),
      updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profile when auth user is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();

-- =====================
-- Helper Functions
-- =====================

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  permissions TEXT[];
BEGIN
  SELECT array_agg(DISTINCT perm)
  INTO permissions
  FROM (
    SELECT unnest(r.permissions) as perm
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND r.is_active = TRUE
  ) perms;
  
  RETURN COALESCE(permissions, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN permission_name = ANY(get_user_permissions(user_uuid));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the given permissions
CREATE OR REPLACE FUNCTION user_has_any_permission(user_uuid UUID, permission_names TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions TEXT[];
BEGIN
  user_permissions := get_user_permissions(user_uuid);
  RETURN permission_names && user_permissions; -- Array overlap operator
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- Data Migration
-- =====================

-- Migrate existing auth users to user_profiles
INSERT INTO user_profiles (
  user_id,
  user_type,
  app_access,
  first_name,
  last_name,
  is_active,
  is_verified,
  created_at
)
SELECT 
  u.id,
  COALESCE(u.user_metadata->>'user_type', 'admin_staff'), -- Assume existing users are admin
  ARRAY['admin'], -- Existing users get admin access
  u.user_metadata->>'first_name',
  u.user_metadata->>'last_name',
  TRUE,
  TRUE,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================
-- Views for Convenience
-- =====================

-- View: Enhanced user details
CREATE OR REPLACE VIEW enhanced_users AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  up.user_type,
  up.app_access,
  up.first_name,
  up.last_name,
  up.phone,
  up.avatar_url,
  up.department,
  up.job_title,
  up.employee_id,
  up.member_id,
  up.is_active,
  up.is_verified,
  up.last_login_at,
  up.preferences,
  up.notes,
  COALESCE(
    CASE 
      WHEN up.first_name IS NOT NULL AND up.last_name IS NOT NULL 
      THEN up.first_name || ' ' || up.last_name
      WHEN up.first_name IS NOT NULL 
      THEN up.first_name
      WHEN up.last_name IS NOT NULL 
      THEN up.last_name
      ELSE u.email
    END,
    u.email
  ) as display_name,
  get_user_permissions(u.id) as permissions
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- View: Admin users only
CREATE OR REPLACE VIEW admin_users AS
SELECT * FROM enhanced_users 
WHERE 'admin' = ANY(app_access);

-- View: Mobile users only  
CREATE OR REPLACE VIEW mobile_users AS
SELECT * FROM enhanced_users 
WHERE user_type = 'mobile_user';

-- =====================
-- Comments
-- =====================

COMMENT ON TABLE user_profiles IS 'Extended user profiles for multi-app system';
COMMENT ON COLUMN user_profiles.user_type IS 'Type of user: mobile_user, admin_staff, or hybrid';
COMMENT ON COLUMN user_profiles.app_access IS 'Array of apps user can access: mobile, admin';
COMMENT ON COLUMN user_profiles.member_id IS 'Reference to church member record for mobile users';
COMMENT ON COLUMN user_profiles.employee_id IS 'Unique employee identifier for admin staff';
COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Returns array of permissions for a user';
COMMENT ON FUNCTION user_has_permission(UUID, TEXT) IS 'Checks if user has specific permission';
COMMENT ON FUNCTION user_has_any_permission(UUID, TEXT[]) IS 'Checks if user has any of the given permissions'; 