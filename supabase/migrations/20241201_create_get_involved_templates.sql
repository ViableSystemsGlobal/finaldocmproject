-- Create get_involved_templates table
CREATE TABLE get_involved_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    icon_emoji TEXT DEFAULT '🤝',
    gradient_colors JSONB DEFAULT '{"from": "blue-800", "to": "indigo-900"}',
    ministry_group_id UUID REFERENCES groups(id),
    category TEXT CHECK (category IN ('ministry', 'volunteer', 'community', 'discipleship', 'outreach', 'other')) DEFAULT 'ministry',
    requirements TEXT[],
    benefits TEXT[],
    time_commitment TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    application_form_url TEXT,
    custom_cta_text TEXT DEFAULT 'Learn More',
    custom_cta_url TEXT,
    priority_order INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    seo_meta JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Add RLS policies
ALTER TABLE get_involved_templates ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (admin access)
CREATE POLICY "Admin can manage get involved templates" ON get_involved_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Policy for public read access to published templates
CREATE POLICY "Public can view published templates" ON get_involved_templates
    FOR SELECT USING (status = 'published');

-- Create indexes for performance
CREATE INDEX idx_get_involved_templates_status ON get_involved_templates(status);
CREATE INDEX idx_get_involved_templates_category ON get_involved_templates(category);
CREATE INDEX idx_get_involved_templates_priority ON get_involved_templates(priority_order);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_get_involved_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_get_involved_templates_updated_at
    BEFORE UPDATE ON get_involved_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_get_involved_templates_updated_at(); 