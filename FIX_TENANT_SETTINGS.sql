-- Fix tenant_settings table with contact page columns
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Drop the table if it exists (to ensure clean slate)
DROP TABLE IF EXISTS public.tenant_settings CASCADE;

-- Create tenant_settings table with all columns
CREATE TABLE public.tenant_settings (
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
DROP TRIGGER IF EXISTS update_tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read tenant settings" ON public.tenant_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update tenant settings" ON public.tenant_settings;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tenant_settings;

-- Create policies
CREATE POLICY "Allow authenticated users to read tenant settings" ON public.tenant_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.tenant_settings
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
  'We typically respond within 24 hours during business days',
  'Monday - Friday: 9:00 AM - 5:00 PM',
  'Saturday: 10:00 AM - 2:00 PM | Sunday: After Services'
);

-- Verify the table was created
SELECT 
  'Table created successfully!' as status,
  name, 
  prayer_line, 
  response_time,
  office_hours_weekdays,
  office_hours_weekends
FROM public.tenant_settings;

