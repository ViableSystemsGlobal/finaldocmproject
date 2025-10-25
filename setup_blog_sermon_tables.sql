-- =============================================
-- DOCM Church Blog & Sermon Management Setup
-- =============================================

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- BLOGS TABLE
-- =============================================

-- Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    seo_meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for blogs
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON public.blogs(author);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs(published_at);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);

-- Enable RLS for blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read blogs" ON public.blogs;
DROP POLICY IF EXISTS "Allow authenticated users to insert blogs" ON public.blogs;
DROP POLICY IF EXISTS "Allow authenticated users to update blogs" ON public.blogs;
DROP POLICY IF EXISTS "Allow authenticated users to delete blogs" ON public.blogs;

-- Create policies for blogs
CREATE POLICY "Allow authenticated users to read blogs" ON public.blogs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert blogs" ON public.blogs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update blogs" ON public.blogs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete blogs" ON public.blogs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for blogs
DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at 
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SERMONS TABLE
-- =============================================

-- Create sermons table
CREATE TABLE IF NOT EXISTS public.sermons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    speaker TEXT NOT NULL,
    series TEXT,
    scripture_reference TEXT,
    sermon_date DATE NOT NULL,
    duration INTEGER, -- duration in minutes
    video_type TEXT NOT NULL DEFAULT 'upload' CHECK (video_type IN ('upload', 'youtube')),
    video_url TEXT,
    youtube_url TEXT,
    youtube_id TEXT,
    audio_url TEXT,
    thumbnail_image TEXT,
    transcript TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    seo_meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sermons
CREATE INDEX IF NOT EXISTS idx_sermons_status ON public.sermons(status);
CREATE INDEX IF NOT EXISTS idx_sermons_speaker ON public.sermons(speaker);
CREATE INDEX IF NOT EXISTS idx_sermons_series ON public.sermons(series);
CREATE INDEX IF NOT EXISTS idx_sermons_sermon_date ON public.sermons(sermon_date);
CREATE INDEX IF NOT EXISTS idx_sermons_video_type ON public.sermons(video_type);
CREATE INDEX IF NOT EXISTS idx_sermons_published_at ON public.sermons(published_at);
CREATE INDEX IF NOT EXISTS idx_sermons_created_at ON public.sermons(created_at);
CREATE INDEX IF NOT EXISTS idx_sermons_slug ON public.sermons(slug);

-- Enable RLS for sermons
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read sermons" ON public.sermons;
DROP POLICY IF EXISTS "Allow authenticated users to insert sermons" ON public.sermons;
DROP POLICY IF EXISTS "Allow authenticated users to update sermons" ON public.sermons;
DROP POLICY IF EXISTS "Allow authenticated users to delete sermons" ON public.sermons;

-- Create policies for sermons
CREATE POLICY "Allow authenticated users to read sermons" ON public.sermons
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sermons" ON public.sermons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sermons" ON public.sermons
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete sermons" ON public.sermons
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for sermons
DROP TRIGGER IF EXISTS update_sermons_updated_at ON public.sermons;
CREATE TRIGGER update_sermons_updated_at 
    BEFORE UPDATE ON public.sermons
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment sermon views
CREATE OR REPLACE FUNCTION increment_sermon_views(sermon_id UUID)
RETURNS TABLE(id UUID, view_count INTEGER) 
LANGUAGE plpgsql 
AS $$
BEGIN
    UPDATE public.sermons 
    SET view_count = view_count + 1 
    WHERE sermons.id = sermon_id;
    
    RETURN QUERY 
    SELECT sermons.id, sermons.view_count 
    FROM public.sermons 
    WHERE sermons.id = sermon_id;
END;
$$;

-- =============================================
-- SAMPLE DATA (Optional)
-- =============================================

-- Insert sample blog posts
INSERT INTO public.blogs (title, slug, content, excerpt, author, status, published_at, tags, seo_meta) VALUES 
(
    'Welcome to Our Church Blog',
    'welcome-to-our-church-blog',
    'We are excited to launch our new church blog where we will share inspiring stories, spiritual insights, and updates from our church community. This platform will serve as a digital extension of our fellowship, allowing us to connect with members and visitors alike through meaningful content that strengthens our faith journey together.',
    'Join us as we launch our new church blog, sharing inspiring stories and spiritual insights from our community.',
    'Pastor John Smith',
    'published',
    NOW() - INTERVAL '2 days',
    ARRAY['announcement', 'community', 'welcome'],
    '{"title": "Welcome to Our Church Blog", "description": "Discover inspiring stories and spiritual insights from our church community", "keywords": ["church", "community", "faith", "blog"]}'::jsonb
),
(
    'The Power of Community Prayer',
    'the-power-of-community-prayer',
    'In times of uncertainty and challenge, there is immense strength found in coming together as a community to pray. Our recent prayer gatherings have shown us the transformative power of unified faith and how collectively lifting our voices to God can bring healing, hope, and renewed purpose to our lives and our church family.',
    'Discover how community prayer transforms lives and strengthens our church family bonds.',
    'Sarah Johnson',
    'published',
    NOW() - INTERVAL '1 week',
    ARRAY['prayer', 'community', 'faith'],
    '{"title": "The Power of Community Prayer", "description": "Learn about the transformative power of unified faith in our church community", "keywords": ["prayer", "community", "faith", "unity"]}'::jsonb
),
(
    'Upcoming Easter Celebration Plans',
    'upcoming-easter-celebration-plans',
    'We are preparing for a beautiful Easter celebration that will include special worship services, community events, and opportunities for fellowship. Join us as we commemorate the resurrection of Jesus Christ with joy, thanksgiving, and renewed hope for the future.',
    'Join our Easter celebration with special services and community events.',
    'Ministry Team',
    'draft',
    NULL,
    ARRAY['easter', 'celebration', 'events'],
    '{"title": "Easter Celebration Plans", "description": "Celebrate Easter with our church community through special services and events", "keywords": ["easter", "celebration", "worship", "community"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample sermons
INSERT INTO public.sermons (title, slug, description, speaker, series, scripture_reference, sermon_date, duration, video_type, youtube_url, youtube_id, thumbnail_image, tags, status, published_at, view_count, seo_meta) VALUES 
(
    'Finding Hope in Difficult Times',
    'finding-hope-in-difficult-times',
    'In this powerful message, we explore how faith can sustain us through life''s most challenging moments. Drawing from biblical wisdom and real-life testimonies, we discover that hope is not just a feeling, but a choice we make daily to trust in God''s goodness and plan for our lives.',
    'Pastor John Smith',
    'Faith in Action',
    'Romans 5:3-5',
    CURRENT_DATE - INTERVAL '1 week',
    45,
    'youtube',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    ARRAY['hope', 'faith', 'encouragement'],
    'published',
    NOW() - INTERVAL '1 week',
    127,
    '{"title": "Finding Hope in Difficult Times", "description": "Discover how faith sustains us through life''s challenges", "keywords": ["hope", "faith", "encouragement", "Romans"]}'::jsonb
),
(
    'The Good Shepherd - Understanding God''s Love',
    'the-good-shepherd-understanding-gods-love',
    'Jesus calls himself the Good Shepherd who knows his sheep by name. In this sermon, we delve deep into what this means for our relationship with Christ and how His love guides, protects, and provides for us in every season of life.',
    'Pastor Sarah Johnson',
    'Life of Christ',
    'John 10:11-16',
    CURRENT_DATE - INTERVAL '2 weeks',
    52,
    'youtube',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    ARRAY['shepherd', 'love', 'guidance'],
    'published',
    NOW() - INTERVAL '2 weeks',
    89,
    '{"title": "The Good Shepherd", "description": "Understanding God''s love through the metaphor of the Good Shepherd", "keywords": ["shepherd", "love", "guidance", "John"]}'::jsonb
),
(
    'Building Strong Christian Relationships',
    'building-strong-christian-relationships',
    'God designed us for community. This message explores practical ways to build meaningful, Christ-centered relationships that encourage spiritual growth, provide mutual support, and reflect God''s love to the world around us.',
    'Elder Mike Davis',
    'Community Life',
    'Ephesians 4:25-32',
    CURRENT_DATE - INTERVAL '3 days',
    38,
    'upload',
    NULL,
    NULL,
    NULL,
    ARRAY['relationships', 'community', 'love'],
    'draft',
    NULL,
    0,
    '{"title": "Building Strong Christian Relationships", "description": "Learn to build meaningful, Christ-centered relationships", "keywords": ["relationships", "community", "love", "Ephesians"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Confirmation message
SELECT 'Blog and Sermon tables created successfully with sample data!' as status; 