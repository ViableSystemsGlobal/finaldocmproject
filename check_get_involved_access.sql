-- Check Get Involved templates and access
SELECT 'Checking get_involved_templates table...' as status;

-- Check if table exists and has data
SELECT 
  id,
  title,
  status,
  priority_order,
  icon_emoji,
  time_commitment,
  contact_person,
  created_at
FROM get_involved_templates 
ORDER BY priority_order 
LIMIT 10;

-- Check RLS policies on get_involved_templates
SELECT 'Checking RLS policies for get_involved_templates...' as status;

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
WHERE tablename = 'get_involved_templates';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE tablename = 'get_involved_templates';

-- Test API access as anon user
SET ROLE anon;
SELECT 'Testing as anon user...' as status;

SELECT 
  id,
  title,
  status,
  priority_order
FROM get_involved_templates 
WHERE status = 'published'
ORDER BY priority_order 
LIMIT 5;

-- Reset role
RESET ROLE; 