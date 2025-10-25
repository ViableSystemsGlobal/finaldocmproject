-- Check sermons table access and RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Check if sermons table exists and has data
SELECT 
    'sermons table check' as info,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'published') as published_count
FROM public.sermons;

-- 2. Check RLS status on sermons table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasoids
FROM pg_tables 
WHERE tablename = 'sermons';

-- 3. Check current RLS policies on sermons table
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
WHERE tablename = 'sermons'
ORDER BY policyname;

-- 4. Test a simple query as would be done by the web app
SELECT 
    id,
    title,
    speaker,
    status,
    sermon_date
FROM public.sermons 
WHERE status = 'published'
ORDER BY sermon_date DESC
LIMIT 3; 