-- Fix sermons page CMS permissions
-- Run this in your Supabase SQL editor

-- Enable RLS on pages and page_sections tables (if not already enabled)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access to sermons page content
-- This allows the web app to fetch CMS content without authentication

-- Policy for pages table - allow public read access for sermons page
CREATE POLICY "Allow public read access to sermons page" ON pages
    FOR SELECT TO public
    USING (slug = 'sermons');

-- Policy for page_sections table - allow public read access for sermons page sections
CREATE POLICY "Allow public read access to sermons page sections" ON page_sections
    FOR SELECT TO public
    USING (
        page_id IN (
            SELECT id FROM pages WHERE slug = 'sermons'
        )
    );

-- Insert default sermons page content if it doesn't exist
INSERT INTO pages (slug, title, seo_meta, published_at)
VALUES (
    'sermons',
    'Sermons Page',
    '{
        "title": "Sermons - Messages that Transform Hearts",
        "description": "Discover powerful biblical teachings that speak to your soul, challenge your thinking, and inspire you to live out your faith with passion and purpose.",
        "image_url": ""
    }'::jsonb,
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Get the sermons page ID and handle sections
DO $$
DECLARE
    sermons_page_id UUID;
    hero_exists BOOLEAN;
    latest_sermons_exists BOOLEAN;
BEGIN
    SELECT id INTO sermons_page_id FROM pages WHERE slug = 'sermons';
    
    -- Check if hero section already exists
    SELECT EXISTS(
        SELECT 1 FROM page_sections 
        WHERE page_id = sermons_page_id AND type = 'hero'
    ) INTO hero_exists;
    
    -- Check if latest_sermons section already exists
    SELECT EXISTS(
        SELECT 1 FROM page_sections 
        WHERE page_id = sermons_page_id AND type = 'latest_sermons'
    ) INTO latest_sermons_exists;
    
    -- Insert or update hero section
    IF hero_exists THEN
        UPDATE page_sections 
        SET props = '{
            "heading": "Messages that transform hearts.",
            "subheading": "Audio & Video Messages",
            "description": "Discover powerful biblical teachings that speak to your soul, challenge your thinking, and inspire you to live out your faith with passion and purpose.",
            "backgroundImage": "https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/uploadmedia/58080f65-7f4b-4a42-8200-7f9695a7d3ca.webp",
            "ctaButtons": [
                {
                    "text": "Listen Now",
                    "link": "#latest-sermons",
                    "style": "primary"
                },
                {
                    "text": "Browse Series",
                    "link": "/media/sermons/browse", 
                    "style": "secondary"
                }
            ]
        }'::jsonb
        WHERE page_id = sermons_page_id AND type = 'hero';
    ELSE
        INSERT INTO page_sections (page_id, type, "order", props)
        VALUES (
            sermons_page_id,
            'hero',
            0,
            '{
                "heading": "Messages that transform hearts.",
                "subheading": "Audio & Video Messages",
                "description": "Discover powerful biblical teachings that speak to your soul, challenge your thinking, and inspire you to live out your faith with passion and purpose.",
                "backgroundImage": "https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/uploadmedia/58080f65-7f4b-4a42-8200-7f9695a7d3ca.webp",
                "ctaButtons": [
                    {
                        "text": "Listen Now",
                        "link": "#latest-sermons",
                        "style": "primary"
                    },
                    {
                        "text": "Browse Series",
                        "link": "/media/sermons/browse", 
                        "style": "secondary"
                    }
                ]
            }'::jsonb
        );
    END IF;
    
    -- Insert or update latest sermons section
    IF latest_sermons_exists THEN
        UPDATE page_sections 
        SET props = '{
            "sectionTitle": "Recently Added",
            "sectionHeading": "Latest Sermons",
            "sectionDescription": "Catch up on our most recent teachings and never miss a message that could transform your life",
            "showFeatured": true,
            "maxSermons": 4
        }'::jsonb
        WHERE page_id = sermons_page_id AND type = 'latest_sermons';
    ELSE
        INSERT INTO page_sections (page_id, type, "order", props)
        VALUES (
            sermons_page_id,
            'latest_sermons',
            1,
            '{
                "sectionTitle": "Recently Added",
                "sectionHeading": "Latest Sermons",
                "sectionDescription": "Catch up on our most recent teachings and never miss a message that could transform your life",
                "showFeatured": true,
                "maxSermons": 4
            }'::jsonb
        );
    END IF;
    
END $$;

-- Verify the setup
SELECT 
    p.slug,
    p.title,
    ps.type,
    ps."order",
    ps.props
FROM pages p
JOIN page_sections ps ON p.id = ps.page_id
WHERE p.slug = 'sermons'
ORDER BY ps."order"; 