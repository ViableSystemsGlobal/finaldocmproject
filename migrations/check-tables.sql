-- This query will show all tables in the people schema
SELECT
    schemaname || '.' || tablename as table_name,
    tableowner as owner,
    tablespace
FROM
    pg_catalog.pg_tables
WHERE
    schemaname = 'people'
ORDER BY schemaname, tablename;

-- This will show schema information
SELECT 
    nspname as schema_name,
    pg_catalog.pg_get_userbyid(nspowner) as schema_owner
FROM 
    pg_catalog.pg_namespace
WHERE 
    nspname = 'people';

-- Check if schema exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'people'
); 