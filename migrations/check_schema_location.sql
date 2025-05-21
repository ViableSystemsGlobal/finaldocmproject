-- This will show all tables and their schemas
SELECT 
    table_schema,
    table_name
FROM 
    information_schema.tables
WHERE 
    table_name IN ('contacts', 'members', 'groups', 'group_memberships', 'mobile_app_users', 'tenants')
    AND table_schema IN ('public', 'people')
ORDER BY 
    table_schema, 
    table_name; 