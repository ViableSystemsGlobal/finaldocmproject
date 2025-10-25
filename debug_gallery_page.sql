-- Debug: Check if gallery page exists in database
-- Run this in your Supabase SQL editor to see what's in the database

-- Check if gallery page exists
SELECT 
    id,
    slug,
    title,
    created_at,
    updated_at,
    published_at
FROM pages 
WHERE slug = 'gallery';

-- Check gallery page sections
SELECT 
    ps.id,
    ps.type,
    ps."order",
    ps.props,
    ps.created_at
FROM pages p
JOIN page_sections ps ON p.id = ps.page_id
WHERE p.slug = 'gallery'
ORDER BY ps."order";

-- Check all existing policies for gallery page
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('pages', 'page_sections') 
AND policyname LIKE '%gallery%';

-- Check if pages and page_sections tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('pages', 'page_sections'); 