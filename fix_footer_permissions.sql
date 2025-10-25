-- Fix footer settings access for public users
-- This allows the web app to read footer configuration

-- Enable RLS on footer_settings if not already enabled
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read footer settings" ON footer_settings;
DROP POLICY IF EXISTS "Authenticated users can view footer settings" ON footer_settings;
DROP POLICY IF EXISTS "Service role can manage footer settings" ON footer_settings;

-- Policy 1: Allow public (anonymous) users to SELECT footer settings
CREATE POLICY "Public can read footer settings"
  ON footer_settings
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Allow authenticated users to view footer settings
CREATE POLICY "Authenticated users can view footer settings"
  ON footer_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can manage footer settings"
  ON footer_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Test the access
SELECT 'Testing public footer settings access...' as status;

-- Set role to anon to test
SET ROLE anon;

-- Try to read footer settings
SELECT id, enabled, layout, background_color, text_color 
FROM footer_settings 
LIMIT 1;

-- Reset role
RESET ROLE;

SELECT 'Footer settings access fixed! ✅' as result; 