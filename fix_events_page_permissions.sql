-- Fix permissions for events page data access

-- Grant SELECT permissions on pages table for events page
GRANT SELECT ON pages TO anon;
GRANT SELECT ON page_sections TO anon;

-- Enable RLS if not already enabled
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to published pages and their sections
CREATE POLICY "Allow public access to published pages" ON pages
FOR SELECT TO public
USING (published_at IS NOT NULL);

CREATE POLICY "Allow public access to page sections" ON page_sections
FOR SELECT TO public
USING (
  page_id IN (
    SELECT id FROM pages WHERE published_at IS NOT NULL
  )
);

-- Ensure events page exists (if it doesn't already)
INSERT INTO pages (slug, title, seo_meta, published_at)
VALUES (
  'events',
  'Events Page',
  '{"title": "Events - DOCM Church", "description": "Join us for upcoming events and community gatherings at DOCM Church"}'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Add hero section for events page if it doesn't exist
INSERT INTO page_sections (page_id, type, "order", props)
SELECT 
  p.id,
  'hero',
  0,
  '{
    "heading": "Connecting hearts through fellowship.",
    "subheading": "Join us for meaningful gatherings, celebrations, and opportunities to grow in faith together. From worship services to community outreach, discover events that inspire and unite our church family.",
    "first_line": "Community Events",
    "backgroundImage": "",
    "ctaButtons": [
      {"text": "View Events", "link": "#upcoming-events", "style": "primary"},
      {"text": "Get Involved", "link": "/contact", "style": "secondary"}
    ]
  }'::jsonb
FROM pages p
WHERE p.slug = 'events'
AND NOT EXISTS (
  SELECT 1 FROM page_sections ps 
  WHERE ps.page_id = p.id AND ps.type = 'hero'
);

-- Add upcoming events section for events page if it doesn't exist
INSERT INTO page_sections (page_id, type, "order", props)
SELECT 
  p.id,
  'upcoming_events',
  1,
  '{
    "first_line": "What''s Coming Up",
    "main_header": "Upcoming Events",
    "subheader": "Don''t miss these opportunities to connect, grow, and serve together as a church family",
    "showFilters": true,
    "eventsPerPage": 10
  }'::jsonb
FROM pages p
WHERE p.slug = 'events'
AND NOT EXISTS (
  SELECT 1 FROM page_sections ps 
  WHERE ps.page_id = p.id AND ps.type = 'upcoming_events'
); 