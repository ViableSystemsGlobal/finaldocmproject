-- Add or update tenant_settings table with branding support
-- This migration ensures the tenant_settings table exists with all required branding columns

CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    time_zone TEXT NOT NULL DEFAULT 'America/New_York',
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#1A202C',
    secondary_color TEXT NOT NULL DEFAULT '#F6E05E',
    website TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::text, NOW()) NOT NULL
);

-- Ensure logo_url column exists (if table already existed)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tenant_settings' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE tenant_settings ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('UTC'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tenant_settings
DROP TRIGGER IF EXISTS update_tenant_settings_updated_at ON tenant_settings;
CREATE TRIGGER update_tenant_settings_updated_at
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read tenant settings
CREATE POLICY "Allow authenticated users to read tenant settings" ON tenant_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update tenant settings
CREATE POLICY "Allow authenticated users to update tenant settings" ON tenant_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert tenant settings
CREATE POLICY "Allow authenticated users to insert tenant settings" ON tenant_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a default tenant settings record if none exists
INSERT INTO tenant_settings (name, time_zone, primary_color, secondary_color)
SELECT 'CICS Admin', 'America/New_York', '#1A202C', '#F6E05E'
WHERE NOT EXISTS (SELECT 1 FROM tenant_settings);

COMMENT ON TABLE tenant_settings IS 'Stores church/organization branding and configuration settings';
COMMENT ON COLUMN tenant_settings.logo_url IS 'URL to the church logo image, displayed in sidebar and header';
COMMENT ON COLUMN tenant_settings.name IS 'Church name, replaces "CICS Admin" in the interface';
COMMENT ON COLUMN tenant_settings.primary_color IS 'Primary brand color used throughout the interface';
COMMENT ON COLUMN tenant_settings.secondary_color IS 'Secondary brand color for accents and highlights'; 