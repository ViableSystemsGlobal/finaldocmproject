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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sermons_status ON public.sermons(status);
CREATE INDEX IF NOT EXISTS idx_sermons_speaker ON public.sermons(speaker);
CREATE INDEX IF NOT EXISTS idx_sermons_series ON public.sermons(series);
CREATE INDEX IF NOT EXISTS idx_sermons_sermon_date ON public.sermons(sermon_date);
CREATE INDEX IF NOT EXISTS idx_sermons_video_type ON public.sermons(video_type);
CREATE INDEX IF NOT EXISTS idx_sermons_published_at ON public.sermons(published_at);
CREATE INDEX IF NOT EXISTS idx_sermons_created_at ON public.sermons(created_at);
CREATE INDEX IF NOT EXISTS idx_sermons_slug ON public.sermons(slug);

-- Enable Row Level Security
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read sermons" ON public.sermons
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sermons" ON public.sermons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sermons" ON public.sermons
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete sermons" ON public.sermons
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at timestamp
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