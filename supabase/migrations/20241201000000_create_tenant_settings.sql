-- Create tenant_settings table for church configuration
-- This table stores church profile, branding, and contact settings

CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  time_zone TEXT NOT NULL DEFAULT 'America/New_York',
  logo_url TEXT,
  logo_white_url TEXT,
  logo_black_url TEXT,
  logo_mobile_url TEXT,
  logo_web_url TEXT,
  logo_admin_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1A202C',
  secondary_color TEXT NOT NULL DEFAULT '#F6E05E',
  website TEXT,
  description TEXT,
  -- Contact page specific settings
  prayer_line TEXT,
  response_time TEXT,
  office_hours_weekdays TEXT,
  office_hours_weekends TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tenant_settings
CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read tenant settings
CREATE POLICY "Allow authenticated users to read tenant settings" ON public.tenant_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update tenant settings
CREATE POLICY "Allow authenticated users to update tenant settings" ON public.tenant_settings
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default tenant settings
INSERT INTO public.tenant_settings (
  name,
  address,
  contact_email,
  contact_phone,
  time_zone,
  primary_color,
  secondary_color,
  prayer_line,
  response_time,
  office_hours_weekdays,
  office_hours_weekends
) VALUES (
  'Demonstration of Christ Ministries',
  '1234 Faith Avenue, Aurora, CO 80014',
  'hello@docmchurch.org',
  '(720) 555-0123',
  'America/Denver',
  '#1A202C',
  '#F6E05E',
  '(720) 323-0135',
  'We typically respond within 24 hours',
  'Monday - Friday: 9:00 AM - 5:00 PM',
  'Saturday: 10:00 AM - 2:00 PM | Sunday: After Services'
) ON CONFLICT DO NOTHING;

-- Add comments to the columns
COMMENT ON TABLE public.tenant_settings IS 'Church profile, branding, and contact settings';
COMMENT ON COLUMN public.tenant_settings.name IS 'Church name';
COMMENT ON COLUMN public.tenant_settings.address IS 'Church address';
COMMENT ON COLUMN public.tenant_settings.contact_email IS 'Primary contact email';
COMMENT ON COLUMN public.tenant_settings.contact_phone IS 'Primary contact phone';
COMMENT ON COLUMN public.tenant_settings.time_zone IS 'Church timezone';
COMMENT ON COLUMN public.tenant_settings.logo_url IS 'Primary logo URL';
COMMENT ON COLUMN public.tenant_settings.primary_color IS 'Primary brand color';
COMMENT ON COLUMN public.tenant_settings.secondary_color IS 'Secondary brand color';
COMMENT ON COLUMN public.tenant_settings.prayer_line IS 'Phone number for urgent prayer requests displayed on contact page';
COMMENT ON COLUMN public.tenant_settings.response_time IS 'Expected response time for contact form submissions';
COMMENT ON COLUMN public.tenant_settings.office_hours_weekdays IS 'Office hours during weekdays';
COMMENT ON COLUMN public.tenant_settings.office_hours_weekends IS 'Office hours during weekends'; 