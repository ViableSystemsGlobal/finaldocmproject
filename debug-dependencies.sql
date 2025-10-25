-- Debug script to check dependencies function and tables
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Check if the function exists
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'check_contact_dependencies';

-- 2. Check what tables exist that we're trying to query
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN (
    'contacts',
    'group_memberships', 
    'groups',
    'discipleship_memberships',
    'discipleship_groups', 
    'members',
    'follow_ups',
    'event_attendance',
    'soul_winning',
    'prayer_requests'
)
ORDER BY table_schema, table_name;

-- 3. Test a simple version of dependency checking
SELECT 
    'group_memberships' as table_name,
    COUNT(*) as record_count
FROM group_memberships
WHERE contact_id = 'test-id'
UNION ALL
SELECT 
    'discipleship_memberships' as table_name,
    COUNT(*) as record_count  
FROM discipleship_memberships
WHERE contact_id = 'test-id'
UNION ALL
SELECT 
    'members' as table_name,
    COUNT(*) as record_count
FROM members  
WHERE contact_id = 'test-id'; 