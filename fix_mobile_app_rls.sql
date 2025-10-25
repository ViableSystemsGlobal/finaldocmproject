-- Fix RLS policies for mobile app users
-- This script ensures mobile app users can access their own prayer requests and transport requests

-- Prayer Requests RLS Policies
DO $$
BEGIN
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Allow public insert" ON prayer_requests;
    DROP POLICY IF EXISTS "Allow pastoral staff full access" ON prayer_requests;
    DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON prayer_requests;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON prayer_requests;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON prayer_requests;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON prayer_requests;

    -- Create new policies that work for mobile app users
    CREATE POLICY "Allow authenticated users to read prayer requests" ON prayer_requests
      FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to insert prayer requests" ON prayer_requests
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to update their prayer requests" ON prayer_requests
      FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to delete their prayer requests" ON prayer_requests
      FOR DELETE USING (auth.role() = 'authenticated');

    -- Allow service role full access
    CREATE POLICY "Service role full access to prayer_requests" ON prayer_requests
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

    RAISE NOTICE '✅ Updated prayer_requests RLS policies';
END $$;

-- Transport Requests RLS Policies  
DO $$
BEGIN
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Transport users can view all transport requests" ON transport_requests;
    DROP POLICY IF EXISTS "Transport users can insert transport requests" ON transport_requests;
    DROP POLICY IF EXISTS "Transport users can update transport requests" ON transport_requests;
    DROP POLICY IF EXISTS "Transport users can delete transport requests" ON transport_requests;
    DROP POLICY IF EXISTS "Allow all operations on transport_requests" ON transport_requests;

    -- Create new policies that work for mobile app users
    CREATE POLICY "Allow authenticated users to read transport requests" ON transport_requests
      FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to insert transport requests" ON transport_requests
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to update transport requests" ON transport_requests
      FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to delete transport requests" ON transport_requests
      FOR DELETE USING (auth.role() = 'authenticated');

    -- Allow service role full access
    CREATE POLICY "Service role full access to transport_requests" ON transport_requests
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

    RAISE NOTICE '✅ Updated transport_requests RLS policies';
END $$;

-- Enable RLS and grant permissions
DO $$
BEGIN
    -- Ensure tables have RLS enabled
    ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;

    -- Grant necessary permissions
    GRANT ALL ON prayer_requests TO authenticated;
    GRANT ALL ON transport_requests TO authenticated;
    GRANT ALL ON events TO authenticated;
    GRANT ALL ON drivers TO authenticated;
    GRANT ALL ON contacts TO authenticated;
    GRANT ALL ON mobile_app_users TO authenticated;

    RAISE NOTICE '🎯 Mobile app RLS policies updated successfully';
    RAISE NOTICE '📱 Prayer requests and transport requests should now be accessible to mobile app users';
END $$; 