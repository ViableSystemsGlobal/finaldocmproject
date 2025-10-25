-- Fix RLS policies for prayer_requests table
-- This ensures website prayer request submissions work properly

-- Drop all existing policies for prayer_requests
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON prayer_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON prayer_requests;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON prayer_requests;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON prayer_requests;
DROP POLICY IF EXISTS "Allow public insert" ON prayer_requests;
DROP POLICY IF EXISTS "Allow pastoral staff full access" ON prayer_requests;
DROP POLICY IF EXISTS "Admin full access to prayer_requests" ON prayer_requests;
DROP POLICY IF EXISTS "Service role insert prayer_requests" ON prayer_requests;
DROP POLICY IF EXISTS "Service role full access to prayer_requests" ON prayer_requests;
DROP POLICY IF EXISTS "Allow authenticated users to read prayer requests" ON prayer_requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert prayer requests" ON prayer_requests;
DROP POLICY IF EXISTS "Allow authenticated users to update their prayer requests" ON prayer_requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete their prayer requests" ON prayer_requests;

-- Create new comprehensive policies that work for both admin and website

-- 1. Allow service role (used by website API) full access
CREATE POLICY "Service role full access to prayer_requests" ON prayer_requests
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. Allow authenticated admin users full access  
CREATE POLICY "Admin full access to prayer_requests" ON prayer_requests
  FOR ALL 
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow anon role to insert (for website forms without authentication)
CREATE POLICY "Allow public insert to prayer_requests" ON prayer_requests
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT INSERT ON prayer_requests TO anon;
GRANT ALL ON prayer_requests TO authenticated;
GRANT ALL ON prayer_requests TO service_role;

-- Test the policy by showing current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'prayer_requests'
ORDER BY policyname;

-- Show a success message
DO $$
BEGIN
    RAISE NOTICE '✅ Prayer requests RLS policies have been updated!';
    RAISE NOTICE '📝 Website prayer request submissions should now work properly';
    RAISE NOTICE '👥 Admin users can still access all prayer requests';
    RAISE NOTICE '🔒 Security is maintained with proper role-based access';
END $$; 