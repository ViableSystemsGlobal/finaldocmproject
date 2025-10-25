-- Database diagnostic script
-- Run this in your Supabase SQL Editor to check table status

-- 1. Check if tables exist in public schema
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('events', 'registrations', 'invitations', 'event_images', 'contacts')
ORDER BY tablename;

-- 2. Check RLS status for these tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('events', 'registrations', 'invitations', 'event_images', 'contacts')
ORDER BY tablename;

-- 3. Check what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('events', 'registrations', 'invitations', 'event_images', 'contacts')
ORDER BY tablename, policyname;

-- 4. Check current user and role
SELECT current_user, current_role;

-- 5. Show all tables in public schema (in case table names are different)
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename; 