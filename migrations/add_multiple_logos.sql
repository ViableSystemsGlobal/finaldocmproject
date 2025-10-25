-- Migration to add multiple logo variations to tenant_settings
-- This allows different logos for different contexts (white, black, mobile, web, admin)

-- Add new logo columns
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_white_url TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_black_url TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_mobile_url TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_web_url TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_admin_url TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN tenant_settings.logo_white_url IS 'White logo variant for dark backgrounds';
COMMENT ON COLUMN tenant_settings.logo_black_url IS 'Black logo variant for light backgrounds';
COMMENT ON COLUMN tenant_settings.logo_mobile_url IS 'Logo optimized for mobile app';
COMMENT ON COLUMN tenant_settings.logo_web_url IS 'Logo for website and web applications';
COMMENT ON COLUMN tenant_settings.logo_admin_url IS 'Logo specifically for admin interface';

-- Update the comment for the original logo_url to clarify its purpose
COMMENT ON COLUMN tenant_settings.logo_url IS 'Primary church logo (fallback when specific variants not available)'; 