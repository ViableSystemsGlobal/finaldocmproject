-- Fix Get Involved templates access for public users
-- This allows the web app to read published Get Involved templates

-- Enable RLS on get_involved_templates if not already enabled
ALTER TABLE get_involved_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view published get involved templates" ON get_involved_templates;
DROP POLICY IF EXISTS "Authenticated users can view get involved templates" ON get_involved_templates;
DROP POLICY IF EXISTS "Service role can manage get involved templates" ON get_involved_templates;

-- Policy 1: Allow public (anonymous) users to read published Get Involved templates
CREATE POLICY "Public can view published get involved templates"
  ON get_involved_templates
  FOR SELECT
  TO public
  USING (status = 'published');

-- Policy 2: Allow authenticated users to read all Get Involved templates
CREATE POLICY "Authenticated users can view get involved templates"
  ON get_involved_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can manage get involved templates"
  ON get_involved_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also fix access to groups table (since get_involved_templates references it)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for groups if they exist
DROP POLICY IF EXISTS "Public can view groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can view groups" ON groups;
DROP POLICY IF EXISTS "Service role can manage groups" ON groups;

-- Allow public read access to groups (needed for ministry group info)
CREATE POLICY "Public can view groups"
  ON groups
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users full read access to groups
CREATE POLICY "Authenticated users can view groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to manage groups
CREATE POLICY "Service role can manage groups"
  ON groups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Test the access
SELECT 'Testing public access to published get involved templates...' as status;

-- Set role to anon to test
SET ROLE anon;

SELECT 
  id,
  title,
  status,
  priority_order,
  icon_emoji,
  time_commitment,
  contact_person
FROM get_involved_templates 
WHERE status = 'published'
ORDER BY priority_order 
LIMIT 5;

-- Reset role
RESET ROLE;

SELECT 'Get Involved templates access fixed! ✅' as result; 