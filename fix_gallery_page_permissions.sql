-- Fix gallery page CMS permissions
-- Run this in your Supabase SQL editor

-- Enable RLS on pages and page_sections tables (if not already enabled)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access to gallery page content
-- This allows the web app to fetch CMS content without authentication

-- Policy for pages table - allow public read access for gallery page
CREATE POLICY "Allow public read access to gallery page" ON pages
    FOR SELECT TO public
    USING (slug = 'gallery');

-- Policy for page_sections table - allow public read access for gallery page sections
CREATE POLICY "Allow public read access to gallery page sections" ON page_sections
    FOR SELECT TO public
    USING (
        page_id IN (
            SELECT id FROM pages WHERE slug = 'gallery'
        )
    );

-- Insert default gallery page content if it doesn't exist
INSERT INTO pages (slug, title, seo_meta, published_at)
VALUES (
    'gallery',
    'Gallery Page',
    '{
        "title": "Gallery - Visual Stories of Faith",
        "description": "Experience the joy, fellowship, and transformative moments that define our church community through beautiful photographs and inspiring videos.",
        "image_url": ""
    }'::jsonb,
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Get the gallery page ID and handle sections
DO $$
DECLARE
    gallery_page_id UUID;
    hero_exists BOOLEAN;
    photo_galleries_exists BOOLEAN;
    video_galleries_exists BOOLEAN;
BEGIN
    SELECT id INTO gallery_page_id FROM pages WHERE slug = 'gallery';
    
    -- Check if hero section already exists
    SELECT EXISTS(
        SELECT 1 FROM page_sections 
        WHERE page_id = gallery_page_id AND type = 'hero'
    ) INTO hero_exists;
    
    -- Check if photo_galleries section already exists
    SELECT EXISTS(
        SELECT 1 FROM page_sections 
        WHERE page_id = gallery_page_id AND type = 'photo_galleries'
    ) INTO photo_galleries_exists;
    
    -- Check if video_galleries section already exists
    SELECT EXISTS(
        SELECT 1 FROM page_sections 
        WHERE page_id = gallery_page_id AND type = 'video_galleries'
    ) INTO video_galleries_exists;
    
    -- Insert or update hero section
    IF hero_exists THEN
        UPDATE page_sections 
        SET props = '{
            "heading": "Capturing God''s Work Among Us",
            "subheading": "Visual Stories",
            "description": "Experience the joy, fellowship, and transformative moments that define our church community through beautiful photographs and inspiring videos.",
            "backgroundImage": "https://images.unsplash.com/photo-1511895426328-dc8714efa987?w=1920&h=1080&fit=crop",
            "ctaButtons": [
                {
                    "text": "Browse Photos",
                    "link": "#photo-galleries",
                    "style": "primary"
                },
                {
                    "text": "Watch Videos",
                    "link": "#video-galleries", 
                    "style": "secondary"
                }
            ]
        }'::jsonb
        WHERE page_id = gallery_page_id AND type = 'hero';
    ELSE
        INSERT INTO page_sections (page_id, type, "order", props)
        VALUES (
            gallery_page_id,
            'hero',
            0,
            '{
                "heading": "Capturing God''s Work Among Us",
                "subheading": "Visual Stories",
                "description": "Experience the joy, fellowship, and transformative moments that define our church community through beautiful photographs and inspiring videos.",
                "backgroundImage": "https://images.unsplash.com/photo-1511895426328-dc8714efa987?w=1920&h=1080&fit=crop",
                "ctaButtons": [
                    {
                        "text": "Browse Photos",
                        "link": "#photo-galleries",
                        "style": "primary"
                    },
                    {
                        "text": "Watch Videos",
                        "link": "#video-galleries", 
                        "style": "secondary"
                    }
                ]
            }'::jsonb
        );
    END IF;
    
    -- Insert or update photo galleries section
    IF photo_galleries_exists THEN
        UPDATE page_sections 
        SET props = '{
            "sectionTitle": "Photo Galleries",
            "sectionHeading": "Moments Worth Remembering",
            "sectionDescription": "Browse through our collection of photographs capturing the heart and spirit of our church community"
        }'::jsonb
        WHERE page_id = gallery_page_id AND type = 'photo_galleries';
    ELSE
        INSERT INTO page_sections (page_id, type, "order", props)
        VALUES (
            gallery_page_id,
            'photo_galleries',
            1,
            '{
                "sectionTitle": "Photo Galleries",
                "sectionHeading": "Moments Worth Remembering",
                "sectionDescription": "Browse through our collection of photographs capturing the heart and spirit of our church community"
            }'::jsonb
        );
    END IF;
    
    -- Insert or update video galleries section
    IF video_galleries_exists THEN
        UPDATE page_sections 
        SET props = '{
            "sectionTitle": "Video Galleries",
            "sectionHeading": "Stories in Motion",
            "sectionDescription": "Watch and experience the powerful moments and testimonies that inspire our faith journey"
        }'::jsonb
        WHERE page_id = gallery_page_id AND type = 'video_galleries';
    ELSE
        INSERT INTO page_sections (page_id, type, "order", props)
        VALUES (
            gallery_page_id,
            'video_galleries',
            2,
            '{
                "sectionTitle": "Video Galleries",
                "sectionHeading": "Stories in Motion",
                "sectionDescription": "Watch and experience the powerful moments and testimonies that inspire our faith journey"
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
WHERE p.slug = 'gallery'
ORDER BY ps."order"; 