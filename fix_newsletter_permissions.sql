-- Fix newsletter subscribers access for public users
-- This allows the web app to add new newsletter subscribers

-- Enable RLS on newsletter_subscribers if not already enabled
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can view newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Service role can manage newsletter subscribers" ON newsletter_subscribers;

-- Policy 1: Allow public (anonymous) users to INSERT new subscriptions only
CREATE POLICY "Public can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to view all newsletter subscribers  
CREATE POLICY "Authenticated users can view newsletter subscribers"
  ON newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can manage newsletter subscribers"
  ON newsletter_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Test the access
SELECT 'Testing public newsletter subscription access...' as status;

-- Set role to anon to test
SET ROLE anon;

-- Try to insert a test subscription (will be rolled back)
BEGIN;
INSERT INTO newsletter_subscribers (
  email,
  first_name,
  last_name,
  status,
  subscription_source,
  subscribed_at,
  created_at,
  updated_at
) VALUES (
  'test@example.com',
  'Test',
  'User',
  'active',
  'website',
  NOW(),
  NOW(),
  NOW()
);
ROLLBACK;

-- Reset role
RESET ROLE;

SELECT 'Newsletter subscription access fixed! ✅' as result; 