-- Fix blog page setup and add sample data
-- Run this in your Supabase SQL editor

-- Enable RLS on required tables
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access to blog page content
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to blog page" ON pages;
DROP POLICY IF EXISTS "Allow public read access to blog page sections" ON page_sections;
DROP POLICY IF EXISTS "Allow public read access to blogs" ON blogs;

-- Policy for pages table - allow public read access for blog page
CREATE POLICY "Allow public read access to blog page" ON pages
    FOR SELECT TO public
    USING (slug = 'blog' AND published_at IS NOT NULL);

-- Policy for page_sections table - allow public read access for blog page sections
CREATE POLICY "Allow public read access to blog page sections" ON page_sections
    FOR SELECT TO public
    USING (
        page_id IN (
            SELECT id FROM pages WHERE slug = 'blog' AND published_at IS NOT NULL
        )
    );

-- Policy for blogs table - allow public read access to published blogs
CREATE POLICY "Allow public read access to blogs" ON blogs
    FOR SELECT TO public
    USING (status = 'published');

-- Insert blog page if it doesn't exist
INSERT INTO pages (slug, title, seo_meta, published_at)
VALUES (
    'blog',
    'Blog Page',
    '{
        "title": "Blog - Words that Inspire Faith | DOCM Church",
        "description": "Discover inspiring articles, personal testimonies, and thoughtful reflections that will encourage your faith journey and deepen your relationship with God.",
        "image_url": ""
    }'::jsonb,
    NOW()
) ON CONFLICT (slug) DO UPDATE SET
    published_at = NOW(),
    updated_at = NOW();

-- Get the blog page ID and handle sections
DO $$
DECLARE
    blog_page_id UUID;
    hero_exists BOOLEAN;
    posts_section_exists BOOLEAN;
    newsletter_exists BOOLEAN;
BEGIN
    -- Get the blog page ID
    SELECT id INTO blog_page_id FROM pages WHERE slug = 'blog';
    
    -- Check if sections exist
    SELECT EXISTS(SELECT 1 FROM page_sections WHERE page_id = blog_page_id AND type = 'hero') INTO hero_exists;
    SELECT EXISTS(SELECT 1 FROM page_sections WHERE page_id = blog_page_id AND type = 'posts_section') INTO posts_section_exists;
    SELECT EXISTS(SELECT 1 FROM page_sections WHERE page_id = blog_page_id AND type = 'newsletter') INTO newsletter_exists;
    
    -- Insert or update hero section
    IF hero_exists THEN
        DELETE FROM page_sections WHERE page_id = blog_page_id AND type = 'hero';
    END IF;
    
    INSERT INTO page_sections (page_id, type, "order", props)
    VALUES (
        blog_page_id,
        'hero',
        0,
        '{
            "heading": "Words that inspire faith.",
            "subheading": "Stories & Insights",
            "description": "Discover inspiring articles, personal testimonies, and thoughtful reflections that will encourage your faith journey and deepen your relationship with God.",
            "backgroundImage": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop&crop=center",
            "backgroundMedia": {
                "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop&crop=center",
                "type": "image",
                "alt_text": "Beautiful church interior with warm lighting"
            },
            "ctaButtons": [
                {
                    "text": "Read Articles",
                    "link": "#featured-posts",
                    "style": "primary"
                },
                {
                    "text": "Browse Topics",
                    "link": "#blog-categories",
                    "style": "secondary"
                }
            ]
        }'::jsonb
    );
    
    -- Insert or update posts section
    IF posts_section_exists THEN
        DELETE FROM page_sections WHERE page_id = blog_page_id AND type = 'posts_section';
    END IF;
    
    INSERT INTO page_sections (page_id, type, "order", props)
    VALUES (
        blog_page_id,
        'posts_section',
        1,
        '{
            "sectionTitle": "Recent Articles",
            "sectionHeading": "All Posts",
            "sectionDescription": "Stay up to date with fresh insights, personal stories, and practical wisdom for your faith journey"
        }'::jsonb
    );
    
    -- Insert or update newsletter section
    IF newsletter_exists THEN
        DELETE FROM page_sections WHERE page_id = blog_page_id AND type = 'newsletter';
    END IF;
    
    INSERT INTO page_sections (page_id, type, "order", props)
    VALUES (
        blog_page_id,
        'newsletter',
        2,
        '{
            "sectionTitle": "Stay Connected",
            "sectionHeading": "Never miss an update",
            "sectionDescription": "Subscribe to our newsletter and get the latest blog posts delivered straight to your inbox.",
            "placeholderText": "Enter your email address",
            "buttonText": "Subscribe"
        }'::jsonb
    );
    
END $$;

-- Add sample blog posts
INSERT INTO blogs (title, slug, content, excerpt, author, status, published_at, tags, seo_meta) VALUES 
(
    'Walking in God''s Purpose',
    'walking-in-gods-purpose',
    'Discovering your divine calling is one of life''s greatest journeys. In this article, we explore how to align your life with God''s plan and walk confidently in His purpose for you. Through prayer, reflection, and community, we can discern the unique path God has laid out for each of us.

Every believer has been called to something greater than themselves. Whether it''s serving in ministry, being a faithful parent, excelling in your career for God''s glory, or reaching out to those in need, your purpose is woven into God''s grand design.

As we seek Him first, He promises to direct our paths and make our steps secure. Trust in His timing, embrace His guidance, and step boldly into the calling He has placed on your heart.',
    'Discover how to align your life with God''s plan and walk confidently in His divine purpose for you.',
    'Pastor Evans Gyimah',
    'published',
    NOW() - INTERVAL '1 day',
    ARRAY['purpose', 'faith', 'calling', 'spiritual growth'],
    '{"title": "Walking in God''s Purpose - Finding Your Divine Calling", "description": "Discover how to align your life with God''s plan and walk confidently in His divine purpose through prayer and community.", "keywords": ["purpose", "calling", "faith", "spiritual growth", "God''s plan"]}'::jsonb
),
(
    'The Power of Community',
    'the-power-of-community',
    'The early church understood something profound about community that we must rediscover today. In Acts 2:42-47, we see believers devoted to fellowship, breaking bread together, and having all things in common. This wasn''t just a nice ideal—it was the foundation of their spiritual strength.

Community isn''t optional for the Christian life; it''s essential. When we gather together, we experience God''s presence in unique ways. We share our burdens, celebrate our victories, and encourage one another in faith. Iron sharpens iron, and we become better followers of Christ through authentic relationships.

At DOCM Church, we believe that genuine community happens when we open our hearts to one another, serve together, and commit to walking through life''s ups and downs as family. This is where transformation happens—not just in Sunday services, but in the everyday moments of connection.',
    'Explore how authentic Christian community transforms lives and strengthens our faith journey together.',
    'Sarah Williams',
    'published',
    NOW() - INTERVAL '3 days',
    ARRAY['community', 'fellowship', 'church life', 'relationships'],
    '{"title": "The Power of Community - Building Authentic Christian Fellowship", "description": "Discover how authentic Christian community transforms lives and strengthens our faith through genuine relationships.", "keywords": ["community", "fellowship", "church", "relationships", "Christian living"]}'::jsonb
),
(
    'Finding Hope in Difficult Times',
    'finding-hope-in-difficult-times',
    'Life has a way of presenting us with challenges that test our faith and push us to our limits. Whether it''s financial hardship, health struggles, relationship problems, or loss, we all face seasons that feel overwhelming. In these moments, where do we turn for hope?

The Bible reminds us that our hope is not in circumstances, but in the unchanging character of God. Psalm 42:11 asks, "Why are you downcast, O my soul? Put your hope in God, for I will yet praise him, my Savior and my God." Even when we can''t see the way forward, we can trust in God''s faithfulness.

Hope is not denial of our pain—it''s the confident expectation that God is working all things together for good. It''s knowing that our present suffering is not the end of the story. As we anchor our hope in Christ, we find strength to persevere and peace that surpasses understanding.',
    'Discover how to find unshakeable hope in God during life''s most challenging seasons.',
    'Michael Chen',
    'published',
    NOW() - INTERVAL '5 days',
    ARRAY['hope', 'encouragement', 'trials', 'faith'],
    '{"title": "Finding Hope in Difficult Times - Anchoring Faith in God", "description": "Learn how to find unshakeable hope in God during life''s most challenging and difficult seasons.", "keywords": ["hope", "encouragement", "faith", "trials", "difficult times"]}'::jsonb
),
(
    'The Joy of Worship',
    'the-joy-of-worship',
    'Worship is more than singing songs on Sunday morning—it''s a lifestyle of honoring God with every aspect of our lives. When we truly understand what worship means, it transforms not just our Sunday experience, but our entire week.

True worship begins with the heart. It''s about recognizing God''s greatness, goodness, and grace in our lives. Whether we''re singing, praying, serving others, or simply living with integrity, we can worship God in spirit and truth.

Music has a unique power to connect our hearts with heaven. When we lift our voices together, something beautiful happens—our individual stories join the greater story of God''s people throughout history. We become part of the eternal song of praise that echoes through eternity.

Let worship be your response to who God is, not just what He''s done. In every season—whether mountain top or valley—we have reasons to praise Him.',
    'Explore what it means to live a life of worship that goes beyond Sunday morning.',
    'David Rodriguez',
    'published',
    NOW() - INTERVAL '7 days',
    ARRAY['worship', 'praise', 'spiritual life', 'music'],
    '{"title": "The Joy of Worship - Living a Life of Praise", "description": "Discover what it means to live a life of worship that extends far beyond Sunday morning services.", "keywords": ["worship", "praise", "spiritual life", "music", "lifestyle"]}'::jsonb
),
(
    'Serving with Excellence',
    'serving-with-excellence',
    'God has called each of us to serve, but how we serve matters just as much as the fact that we serve. Whether you''re greeting visitors, teaching children, leading worship, or cleaning the church, every act of service is an opportunity to reflect God''s excellence.

Excellence in service isn''t about perfection—it''s about doing our best with a heart full of love for God and others. It means showing up prepared, being reliable, and approaching our responsibilities with joy rather than obligation.

When we serve with excellence, we create an environment where people encounter God''s love in tangible ways. A warm greeting, a well-prepared lesson, or a clean and welcoming space all communicate that God cares about the details and so should we.

Remember, we serve not to earn God''s approval—we serve because we already have it. Our service is a response to His love, not a way to gain it.',
    'Learn how to serve God and others with excellence that reflects His heart for quality and love.',
    'Jennifer Martinez',
    'published',
    NOW() - INTERVAL '10 days',
    ARRAY['service', 'excellence', 'ministry', 'leadership'],
    '{"title": "Serving with Excellence - Reflecting God''s Heart in Ministry", "description": "Discover how to serve God and others with excellence that truly reflects His heart for quality and love.", "keywords": ["service", "excellence", "ministry", "leadership", "volunteer"]}'::jsonb
),
(
    'Building Strong Families',
    'building-strong-families',
    'In a world where families face unprecedented challenges, building a strong, faith-centered family has never been more important. God''s design for family is beautiful—a place of love, security, growth, and discipleship that reflects His heart for relationship.

Strong families don''t happen by accident. They require intentionality, commitment, and grace. It starts with parents who model Christ-like love for each other and create an environment where every family member feels valued and heard.

Prayer should be the foundation of your family life. When families pray together, they stay together. Make time for family devotions, even if it''s just five minutes before bedtime. Read God''s word together, share what you''re learning, and pray for each other''s needs.

Remember that every family is unique, and God meets us where we are. Whether you''re a single parent, empty nesters, or somewhere in between, God has a plan for your family to flourish in His love.',
    'Discover practical ways to build a strong, faith-centered family that honors God.',
    'Mark and Lisa Thompson',
    'published',
    NOW() - INTERVAL '12 days',
    ARRAY['family', 'parenting', 'marriage', 'relationships'],
    '{"title": "Building Strong Families - Creating Faith-Centered Homes", "description": "Learn practical ways to build strong, faith-centered families that honor God and nurture growth.", "keywords": ["family", "parenting", "marriage", "relationships", "faith"]}'::jsonb
);

-- Verify blog page setup
SELECT 
    p.slug,
    p.title,
    ps.type,
    ps."order"
FROM pages p
JOIN page_sections ps ON p.id = ps.page_id
WHERE p.slug = 'blog'
ORDER BY ps."order";

-- Verify blog posts
SELECT 
    title,
    author,
    status,
    published_at,
    tags
FROM blogs
WHERE status = 'published'
ORDER BY published_at DESC; 