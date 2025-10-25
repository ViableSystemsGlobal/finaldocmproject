-- Seed navigation table with current website menu structure
-- Run this in your Supabase SQL editor

-- First, let's clear any existing navigation data (optional)
-- DELETE FROM public.navigation;

-- Insert the Media parent item first
INSERT INTO public.navigation (id, label, href, "order", is_active, parent_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Media', '#', 3, true, null)
ON CONFLICT (id) DO NOTHING;

-- Insert all navigation items
INSERT INTO public.navigation (id, label, href, "order", is_active, parent_id) VALUES
  -- Top level navigation
  ('550e8400-e29b-41d4-a716-446655440002', 'Home', '/', 0, true, null),
  ('550e8400-e29b-41d4-a716-446655440003', 'About', '/about', 1, true, null),
  ('550e8400-e29b-41d4-a716-446655440004', 'Events', '/events', 2, true, null),
  ('550e8400-e29b-41d4-a716-446655440005', 'Contact', '/contact', 4, true, null),
  
  -- Media submenu items (parent_id references the Media item)
  ('550e8400-e29b-41d4-a716-446655440006', 'Sermons', '/media/sermons', 0, true, '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Gallery', '/media/gallery', 1, true, '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Blog', '/media/blog', 2, true, '550e8400-e29b-41d4-a716-446655440001')

ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted correctly
SELECT 
  n1.label as parent_label,
  n1.href as parent_href,
  n1."order" as parent_order,
  n2.label as child_label,
  n2.href as child_href,
  n2."order" as child_order
FROM public.navigation n1
LEFT JOIN public.navigation n2 ON n1.id = n2.parent_id
WHERE n1.parent_id IS NULL
ORDER BY n1."order", n2."order"; 