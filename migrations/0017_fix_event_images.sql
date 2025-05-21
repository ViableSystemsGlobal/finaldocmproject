-- Ensure the event_images table exists in public schema
CREATE TABLE IF NOT EXISTS public.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

-- Create policy for event_images
DROP POLICY IF EXISTS event_images_all_operations_policy ON public.event_images;
CREATE POLICY event_images_all_operations_policy
ON public.event_images
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON TABLE public.event_images TO authenticated, anon, service_role;

-- Log current database structure for debugging
SELECT 
  schemaname as schema, 
  tablename as table_name,
  tableowner as owner
FROM pg_tables
WHERE schemaname IN ('public', 'events')
ORDER BY schemaname, tablename;

-- Log relation permissions
SELECT
  n.nspname as schema,
  c.relname as table_name,
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' END as type,
  a.rolname as role,
  pg_catalog.array_to_string(c.relacl, E'\n') as permissions
FROM
  pg_catalog.pg_class c
  LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_authid a ON a.oid = c.relowner
WHERE
  c.relkind IN ('r', 'v')
  AND n.nspname IN ('public', 'events')
ORDER BY schema, table_name; 