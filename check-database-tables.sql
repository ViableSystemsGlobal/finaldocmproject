-- Check what communication tables exist in the database
-- Run this in Supabase Dashboard > SQL Editor to see what tables are available

-- Check all tables with 'comms' or 'message' in the name
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename LIKE '%comms%' OR tablename LIKE '%message%'
ORDER BY schemaname, tablename;

-- Check if the specific table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'comms.messages'
) AS "comms.messages_exists";

-- Check columns if the table exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comms.messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check all schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE '%comms%'
ORDER BY schema_name; 