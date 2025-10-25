-- =====================================================
-- ADMIN OUTREACH SYSTEM SETUP
-- Creates tables for website messages, prayer requests, and newsletter
-- =====================================================

-- 1. WEBSITE MESSAGES TABLE (Main outreach admin table)
-- This is where all contact form submissions go for admin review
CREATE TABLE IF NOT EXISTS website_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(100) DEFAULT 'General Inquiry',
  message TEXT NOT NULL,
  newsletter_opt_in BOOLEAN DEFAULT false,
  is_prayer_request BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'new', -- new, read, responded, archived
  assigned_to VARCHAR(255), -- Admin user who handles this
  response_notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRAYER REQUESTS TABLE (For pastoral team)
-- Prayer requests get added here IN ADDITION to website_messages
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'Prayer Request',
  newsletter_opt_in BOOLEAN DEFAULT false,
  urgency VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
  is_confidential BOOLEAN DEFAULT true,
  source_submission_id UUID, -- Links to website_messages
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'new', -- new, praying, completed, ongoing
  assigned_pastor VARCHAR(255),
  pastoral_notes TEXT,
  prayer_updates TEXT[],
  followed_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NEWSLETTER SUBSCRIBERS TABLE
-- Separate table for newsletter management
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active', -- active, unsubscribed, bounced
  source VARCHAR(100) DEFAULT 'contact_form', -- contact_form, manual, import
  preferences JSONB DEFAULT '{}', -- Newsletter preferences
  last_email_sent TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Website Messages indexes
CREATE INDEX IF NOT EXISTS idx_website_messages_status ON website_messages(status);
CREATE INDEX IF NOT EXISTS idx_website_messages_category ON website_messages(category);
CREATE INDEX IF NOT EXISTS idx_website_messages_submitted_at ON website_messages(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_messages_email ON website_messages(email);

-- Prayer Requests indexes  
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_urgency ON prayer_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_submitted_at ON prayer_requests(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_source ON prayer_requests(source_submission_id);

-- Newsletter indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscribers(subscribed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE website_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Admin access policies (full access for authenticated admins)
CREATE POLICY "Admin full access to website_messages" ON website_messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to prayer_requests" ON prayer_requests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to newsletter_subscribers" ON newsletter_subscribers
  FOR ALL USING (auth.role() = 'authenticated');

-- Service role policies (for API operations)
CREATE POLICY "Service role insert website_messages" ON website_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role insert prayer_requests" ON prayer_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role insert newsletter_subscribers" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_website_messages_updated_at 
  BEFORE UPDATE ON website_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayer_requests_updated_at 
  BEFORE UPDATE ON prayer_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_subscribers_updated_at 
  BEFORE UPDATE ON newsletter_subscribers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADMIN VIEWS FOR DASHBOARD
-- =====================================================

-- Summary view for admin dashboard
CREATE OR REPLACE VIEW admin_outreach_summary AS
SELECT 
  'website_messages' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'new') as new_count,
  COUNT(*) FILTER (WHERE status = 'responded') as responded_count,
  COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '7 days') as this_week_count
FROM website_messages
UNION ALL
SELECT 
  'prayer_requests' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'new') as new_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '7 days') as this_week_count
FROM prayer_requests
UNION ALL
SELECT 
  'newsletter_subscribers' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count,
  COUNT(*) FILTER (WHERE subscribed_at >= NOW() - INTERVAL '7 days') as this_week_count
FROM newsletter_subscribers;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Admin Outreach System Setup Complete!';
  RAISE NOTICE '✅ Tables created: website_messages, prayer_requests, newsletter_subscribers';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Auto-timestamp triggers added';
  RAISE NOTICE '✅ Admin dashboard views created';
  RAISE NOTICE '';
  RAISE NOTICE 'Contact form submissions will now route to:';
  RAISE NOTICE '📧 All messages → website_messages (admin outreach)';
  RAISE NOTICE '🙏 Prayer requests → prayer_requests (pastoral team)';
  RAISE NOTICE '📰 Newsletter signups → newsletter_subscribers';
END $$; 