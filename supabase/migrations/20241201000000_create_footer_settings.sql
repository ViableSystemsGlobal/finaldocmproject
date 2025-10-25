-- Create footer_settings table
CREATE TABLE IF NOT EXISTS public.footer_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled           boolean NOT NULL DEFAULT true,
  layout            text NOT NULL DEFAULT 'columns',
  background_color  text NOT NULL DEFAULT '#1f2937',
  text_color        text NOT NULL DEFAULT '#ffffff',
  show_church_logo  boolean NOT NULL DEFAULT true,
  logo_url          text DEFAULT NULL,
  show_copyright    boolean NOT NULL DEFAULT true,
  copyright_text    text DEFAULT '© 2024 Your Church Name. All rights reserved.',
  sections          jsonb NOT NULL DEFAULT '[]',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow read access for authenticated users
CREATE POLICY "Allow read access to footer_settings for authenticated users"
  ON public.footer_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow insert access for authenticated users
CREATE POLICY "Allow insert access to footer_settings for authenticated users"
  ON public.footer_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow update access for authenticated users  
CREATE POLICY "Allow update access to footer_settings for authenticated users"
  ON public.footer_settings FOR UPDATE
  TO authenticated
  USING (true);

-- Policy to allow delete access for authenticated users
CREATE POLICY "Allow delete access to footer_settings for authenticated users"
  ON public.footer_settings FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_footer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_footer_settings_updated_at
BEFORE UPDATE ON public.footer_settings
FOR EACH ROW
EXECUTE PROCEDURE update_footer_settings_updated_at();

-- Insert default footer settings
INSERT INTO public.footer_settings (
  enabled,
  layout,
  background_color,
  text_color,
  show_church_logo,
  show_copyright,
  copyright_text,
  sections
) VALUES (
  true,
  'columns',
  '#1f2937',
  '#ffffff',
  true,
  true,
  '© 2024 Your Church Name. All rights reserved.',
  '[
    {
      "id": "contact",
      "title": "Contact Information",
      "type": "contact",
      "content": {
        "address": "123 Church Street\\nCity, State 12345",
        "phone": "(555) 123-4567",
        "email": "info@yourchurch.org",
        "website": "https://yourchurch.org"
      },
      "order": 1,
      "enabled": true
    },
    {
      "id": "quicklinks",
      "title": "Quick Links",
      "type": "links",
      "content": {
        "links": [
          {"id": "1", "label": "About Us", "url": "/about", "external": false, "enabled": true},
          {"id": "2", "label": "Ministries", "url": "/ministries", "external": false, "enabled": true},
          {"id": "3", "label": "Events", "url": "/events", "external": false, "enabled": true},
          {"id": "4", "label": "Give", "url": "/give", "external": false, "enabled": true}
        ]
      },
      "order": 2,
      "enabled": true
    },
    {
      "id": "connect",
      "title": "Connect",
      "type": "links",
      "content": {
        "links": [
          {"id": "5", "label": "Prayer Requests", "url": "/prayer", "external": false, "enabled": true},
          {"id": "6", "label": "Contact Us", "url": "/contact", "external": false, "enabled": true},
          {"id": "7", "label": "Visitor Info", "url": "/visit", "external": false, "enabled": true},
          {"id": "8", "label": "Small Groups", "url": "/groups", "external": false, "enabled": true}
        ]
      },
      "order": 3,
      "enabled": true
    },
    {
      "id": "social",
      "title": "Follow Us",
      "type": "social",
      "content": {
        "links": [
          {"platform": "facebook", "url": "https://facebook.com/yourchurch", "enabled": true},
          {"platform": "instagram", "url": "https://instagram.com/yourchurch", "enabled": true},
          {"platform": "youtube", "url": "https://youtube.com/yourchurch", "enabled": true},
          {"platform": "twitter", "url": "https://twitter.com/yourchurch", "enabled": false}
        ]
      },
      "order": 4,
      "enabled": true
    }
  ]'::jsonb
) ON CONFLICT DO NOTHING; 