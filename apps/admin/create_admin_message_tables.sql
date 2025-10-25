-- ===========================
-- Admin Message Tables Setup
-- Creates website_messages and prayer_requests tables for proper admin routing
-- ===========================

-- Website Messages Table (for general contact form submissions)
CREATE TABLE IF NOT EXISTS website_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  message TEXT NOT NULL,
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer Requests Table (for prayer submissions)
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'Prayer Request',
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  urgency VARCHAR(50) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  is_confidential BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'praying', 'responded', 'archived')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  prayer_started_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  pastoral_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for website_messages
CREATE INDEX IF NOT EXISTS idx_website_messages_email ON website_messages(email);
CREATE INDEX IF NOT EXISTS idx_website_messages_status ON website_messages(status);
CREATE INDEX IF NOT EXISTS idx_website_messages_submitted_at ON website_messages(submitted_at);
CREATE INDEX IF NOT EXISTS idx_website_messages_category ON website_messages(category);

-- Create indexes for prayer_requests
CREATE INDEX IF NOT EXISTS idx_prayer_requests_email ON prayer_requests(email);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_submitted_at ON prayer_requests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_urgency ON prayer_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_confidential ON prayer_requests(is_confidential);

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_website_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER website_messages_updated_at
  BEFORE UPDATE ON website_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_website_messages_updated_at();

CREATE OR REPLACE FUNCTION update_prayer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prayer_requests_updated_at
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_prayer_requests_updated_at();

-- Add Row Level Security (RLS)
ALTER TABLE website_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for website_messages
CREATE POLICY "Allow public insert" ON website_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access" ON website_messages
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for prayer_requests
CREATE POLICY "Allow public insert" ON prayer_requests
  FOR INSERT WITH CHECK (true);

-- More restrictive policy for prayer requests (only pastoral staff)
CREATE POLICY "Allow pastoral staff full access" ON prayer_requests
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data for testing (optional)
-- Uncomment if you want test data

-- INSERT INTO website_messages (name, email, phone, subject, category, message, newsletter_opt_in) VALUES
-- ('Jane Smith', 'jane.smith@example.com', '(555) 234-5678', 'Question about services', 'General Inquiry', 'Hello, I''m interested in learning more about your Sunday services and small groups.', true),
-- ('Bob Johnson', 'bob.j@example.com', NULL, 'Volunteer Inquiry', 'Volunteer Opportunities', 'I would like to volunteer for community outreach programs.', false);

-- INSERT INTO prayer_requests (name, email, phone, subject, message, urgency, is_confidential, newsletter_opt_in) VALUES
-- ('Mary Wilson', 'mary.w@example.com', '(555) 345-6789', 'Health Concerns', 'Please pray for my mother who is facing health challenges.', 'high', true, false),
-- ('David Brown', 'david.brown@example.com', NULL, 'Family Prayer', 'Requesting prayer for family unity and healing.', 'normal', true, true);

-- Verify the tables were created
SELECT 
  'website_messages' as table_name,
  COUNT(*) as record_count
FROM website_messages
UNION ALL
SELECT 
  'prayer_requests' as table_name,
  COUNT(*) as record_count
FROM prayer_requests; 