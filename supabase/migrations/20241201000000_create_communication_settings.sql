-- Create communication_settings table
CREATE TABLE IF NOT EXISTS communication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sms JSONB NOT NULL DEFAULT '{
    "provider": "twilio",
    "sender_id": "CHURCH",
    "daily_limit": 1000,
    "monthly_limit": 10000,
    "cost_per_sms": 0.0075,
    "opt_out_enabled": true,
    "test_mode": true
  }'::jsonb,
  email JSONB NOT NULL DEFAULT '{
    "provider": "smtp",
    "from_name": "Your Church",
    "from_email": "noreply@yourchurch.com",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_secure": true,
    "daily_limit": 5000,
    "monthly_limit": 50000,
    "test_mode": true
  }'::jsonb,
  whatsapp JSONB NOT NULL DEFAULT '{
    "provider": "twilio",
    "phone_number_id": "",
    "business_verified": false,
    "test_mode": true
  }'::jsonb,
  push JSONB NOT NULL DEFAULT '{
    "provider": "firebase",
    "daily_limit": 10000,
    "monthly_limit": 100000,
    "test_mode": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE communication_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read settings
CREATE POLICY "Allow authenticated users to read communication settings"
  ON communication_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to update settings (admin only in practice)
CREATE POLICY "Allow authenticated users to update communication settings"
  ON communication_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings row if none exists
INSERT INTO communication_settings (id) 
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM communication_settings);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_settings_updated_at ON communication_settings(updated_at);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_communication_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_communication_settings_updated_at
  BEFORE UPDATE ON communication_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_settings_updated_at(); 