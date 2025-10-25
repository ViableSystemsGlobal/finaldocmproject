-- Simple test to check what tables exist and test basic functionality
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Check what tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema IN ('public', 'people')
  AND table_name IN (
    'contacts',
    'group_memberships', 
    'groups',
    'discipleship_memberships',
    'discipleship_groups', 
    'members',
    'follow_ups'
  )
ORDER BY table_schema, table_name;

-- 2. Test if we can query contacts table
SELECT COUNT(*) as contact_count FROM contacts;

-- 3. Test if we can query group_memberships table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_memberships') THEN
        RAISE NOTICE 'group_memberships table exists';
        -- Test a simple query
        PERFORM COUNT(*) FROM group_memberships;
        RAISE NOTICE 'group_memberships query successful';
    ELSE
        RAISE NOTICE 'group_memberships table does not exist';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error querying group_memberships: %', SQLERRM;
END $$;

-- 4. Test if we can query members table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        RAISE NOTICE 'members table exists';
        PERFORM COUNT(*) FROM members;
        RAISE NOTICE 'members query successful';
    ELSE
        RAISE NOTICE 'members table does not exist';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error querying members: %', SQLERRM;
END $$; 