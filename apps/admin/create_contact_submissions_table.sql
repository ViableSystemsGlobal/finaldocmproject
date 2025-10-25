-- ===========================
-- Contact Submissions Table
-- Stores all contact form submissions from the website
-- ===========================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  message TEXT NOT NULL,
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  is_prayer_request BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded', 'archived')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_category ON contact_submissions(category);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_prayer ON contact_submissions(is_prayer_request);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Add Row Level Security (RLS)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow insert for anyone (public form submissions)
CREATE POLICY "Allow public insert" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Allow all operations for authenticated users (admin access)
CREATE POLICY "Allow authenticated users full access" ON contact_submissions
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data for testing (optional)
-- Uncomment if you want test data

-- INSERT INTO contact_submissions (name, email, phone, subject, category, message, newsletter_opt_in, is_prayer_request) VALUES
-- ('John Doe', 'john.doe@example.com', '(555) 123-4567', 'Question about Sunday service', 'General Inquiry', 'Hi, I am new to the area and wondering about your Sunday service times and what to expect.', true, false),
-- ('Sarah Johnson', 'sarah.j@example.com', NULL, 'Prayer Request', 'Prayer Request', 'Please pray for my family during this difficult time.', false, true),
-- ('Mike Wilson', 'mike.wilson@example.com', '(555) 987-6543', 'Volunteer Opportunities', 'Volunteer Opportunities', 'I would like to learn more about ways I can volunteer at the church.', true, false);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contact_submissions' 
ORDER BY ordinal_position; 