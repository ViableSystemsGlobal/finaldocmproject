-- Test comms tables accessibility
-- Run this in Supabase Dashboard > SQL Editor to diagnose the issue

-- Check if tables exist
SELECT 'Tables that exist:' as check_type;
SELECT 
    tablename as table_name,
    CASE WHEN rowsecurity THEN 'YES' ELSE 'NO' END as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'comms_%'
ORDER BY tablename;

-- Check campaigns
SELECT 'Campaigns that exist:' as check_type;
SELECT id, name, status, created_at 
FROM public.comms_campaigns 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if comms_recipients table exists and what's in it
SELECT 'Recipients table structure:' as check_type;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'comms_recipients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check recipients data
SELECT 'Recipients that exist:' as check_type;
SELECT COUNT(*) as total_recipients FROM public.comms_recipients;

-- Show recipients with campaign info
SELECT 'Sample recipients:' as check_type;
SELECT 
    cr.id,
    cr.campaign_id,
    cr.to_address,
    cr.status,
    cc.name as campaign_name
FROM public.comms_recipients cr
LEFT JOIN public.comms_campaigns cc ON cr.campaign_id = cc.id
LIMIT 10;

-- Check permissions
SELECT 'Current user and permissions:' as check_type;
SELECT current_user as current_database_user;

-- Test a simple select to see if permissions work
SELECT 'Test simple select:' as check_type;
SELECT 'Can access comms_recipients table' as test_result; 