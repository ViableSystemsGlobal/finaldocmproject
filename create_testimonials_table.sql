-- Create testimonials table for the web app
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  position TEXT,
  quote TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  has_video BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON public.testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON public.testimonials(display_order);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "testimonials_select_policy" ON public.testimonials
FOR SELECT USING (status = 'published');

CREATE POLICY "testimonials_all_authenticated" ON public.testimonials
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert sample testimonials data
INSERT INTO public.testimonials (name, role, quote, image_url, has_video, is_featured, display_order, status) VALUES
(
  'Sarah Johnson',
  'Church Member',
  'Joining DOCM Church was a life-changing decision for our family. The community here brought our faith to life in a way that truly connected with our hearts and transformed our daily walk with Christ.',
  'https://images.unsplash.com/photo-1594736797933-d0401ba8d8ed?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3',
  false,
  true,
  1,
  'published'
),
(
  'Michael Rodriguez',
  'Youth Leader',
  'The youth ministry here has given me purpose and helped me discover my calling to serve others. I''ve grown not just in faith, but in leadership and confidence.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3',
  false,
  true,
  2,
  'published'
),
(
  'Emily Chen',
  'Volunteer Coordinator',
  'Through our community outreach programs, I''ve witnessed incredible transformations. This church doesn''t just talk about love and service - we live it out every day.',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3',
  false,
  true,
  3,
  'published'
),
(
  'David Thompson',
  'Small Group Leader',
  'The sense of belonging and genuine care I''ve found here is unmatched. Our small group has become like family, supporting each other through life''s ups and downs.',
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3',
  false,
  true,
  4,
  'published'
),
(
  'Maria Santos',
  'New Member',
  'As someone new to faith, the patience and understanding shown by this community has been overwhelming. I''ve never felt judged, only loved and supported.',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3',
  false,
  true,
  5,
  'published'
);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER testimonials_updated_at_trigger
    BEFORE UPDATE ON public.testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_testimonials_updated_at();

-- Verify the data was inserted
SELECT 
    'Testimonials table created successfully!' as status,
    COUNT(*) as total_testimonials,
    COUNT(*) FILTER (WHERE is_featured = true) as featured_testimonials
FROM public.testimonials; 