-- Check current database schema to understand table structure
-- Run this in your Supabase SQL Editor

-- 1. List all tables in both public and events schemas
SELECT 
    schemaname,
    tablename,
    'Table exists' as status
FROM pg_tables 
WHERE schemaname IN ('public', 'events')
    AND tablename IN ('events', 'registrations', 'invitations', 'event_images')
ORDER BY schemaname, tablename;

-- 2. Check columns in events table (try both schemas)
SELECT 
    'public.events columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'events'
ORDER BY ordinal_position;

SELECT 
    'events.events columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'events' 
    AND table_name = 'events'
ORDER BY ordinal_position;

-- 3. Check what columns are actually available for RLS policies
SELECT 
    table_schema,
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema IN ('public', 'events')
    AND table_name IN ('events', 'registrations', 'invitations')
    AND column_name LIKE '%tenant%'
ORDER BY table_schema, table_name, column_name;

-- 4. Check if there are any user/auth related columns we can use
SELECT 
    table_schema,
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema IN ('public', 'events')
    AND table_name IN ('events', 'registrations', 'invitations')
    AND (column_name LIKE '%user%' OR column_name LIKE '%auth%' OR column_name LIKE '%owner%' OR column_name LIKE '%created_by%')
ORDER BY table_schema, table_name, column_name; 