-- Newsletter Subscribers Table
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscription_source VARCHAR(50) DEFAULT 'website', -- 'website', 'manual', 'import', 'api'
  segments TEXT[] DEFAULT '{}', -- Array of segment identifiers
  metadata JSONB DEFAULT '{}', -- Additional subscriber data
  unsubscribe_token VARCHAR(255) UNIQUE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Templates Table
CREATE TABLE newsletter_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  thumbnail_url VARCHAR(500),
  category VARCHAR(50) DEFAULT 'general', -- 'general', 'event', 'ministry', 'seasonal'
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Newsletters Table
CREATE TABLE newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  preheader VARCHAR(255),
  content TEXT NOT NULL,
  html_content TEXT,
  template_id UUID REFERENCES newsletter_templates(id),
  sender_name VARCHAR(100) DEFAULT 'DOCM Church',
  sender_email VARCHAR(255) DEFAULT 'newsletter@docmchurch.org',
  reply_to VARCHAR(255) DEFAULT 'admin@docmchurch.org',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'segment', 'custom')),
  subscriber_segments TEXT[] DEFAULT '{}',
  custom_recipient_list UUID[], -- Array of specific subscriber IDs
  scheduled_date TIMESTAMP,
  sent_at TIMESTAMP,
  total_recipients INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  track_opens BOOLEAN DEFAULT TRUE,
  track_clicks BOOLEAN DEFAULT TRUE,
  include_unsubscribe BOOLEAN DEFAULT TRUE,
  campaign_id UUID, -- Link to broader campaigns if needed
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Delivery Log Table
CREATE TABLE newsletter_delivery_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  first_opened_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  clicked_at TIMESTAMP,
  first_clicked_at TIMESTAMP,
  click_count INTEGER DEFAULT 0,
  unsubscribed_at TIMESTAMP,
  bounce_reason TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Click Tracking Table
CREATE TABLE newsletter_click_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  delivery_log_id UUID REFERENCES newsletter_delivery_log(id) ON DELETE CASCADE,
  url VARCHAR(1000) NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Newsletter Segments Table
CREATE TABLE newsletter_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- JSON criteria for automatic segmentation
  is_dynamic BOOLEAN DEFAULT TRUE, -- Whether to automatically update membership
  subscriber_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Settings Table
CREATE TABLE newsletter_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);

CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletters_scheduled_date ON newsletters(scheduled_date);
CREATE INDEX idx_newsletters_sent_at ON newsletters(sent_at);
CREATE INDEX idx_newsletters_created_by ON newsletters(created_by);

CREATE INDEX idx_newsletter_delivery_log_newsletter_id ON newsletter_delivery_log(newsletter_id);
CREATE INDEX idx_newsletter_delivery_log_subscriber_id ON newsletter_delivery_log(subscriber_id);
CREATE INDEX idx_newsletter_delivery_log_status ON newsletter_delivery_log(status);
CREATE INDEX idx_newsletter_delivery_log_delivered_at ON newsletter_delivery_log(delivered_at);

CREATE INDEX idx_newsletter_click_tracking_newsletter_id ON newsletter_click_tracking(newsletter_id);
CREATE INDEX idx_newsletter_click_tracking_clicked_at ON newsletter_click_tracking(clicked_at);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletter_subscribers_updated_at 
  BEFORE UPDATE ON newsletter_subscribers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_templates_updated_at 
  BEFORE UPDATE ON newsletter_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at 
  BEFORE UPDATE ON newsletters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_delivery_log_updated_at 
  BEFORE UPDATE ON newsletter_delivery_log 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_segments_updated_at 
  BEFORE UPDATE ON newsletter_segments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically generate unsubscribe tokens
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token = encode(gen_random_bytes(32), 'base64');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_unsubscribe_token_trigger
  BEFORE INSERT ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION generate_unsubscribe_token();

-- RLS Policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;

-- Policies for admin access
CREATE POLICY "Admin full access to newsletter_subscribers" ON newsletter_subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@docmchurch.org'
    )
  );

CREATE POLICY "Admin full access to newsletter_templates" ON newsletter_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@docmchurch.org'
    )
  );

CREATE POLICY "Admin full access to newsletters" ON newsletters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@docmchurch.org'
    )
  );

CREATE POLICY "Admin full access to newsletter_delivery_log" ON newsletter_delivery_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@docmchurch.org'
    )
  );

CREATE POLICY "Admin full access to newsletter_click_tracking" ON newsletter_click_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@docmchurch.org'
    )
  );

CREATE POLICY "Admin full access to newsletter_segments" ON newsletter_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@docmchurch.org'
    )
  );

CREATE POLICY "Admin full access to newsletter_settings" ON newsletter_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@docmchurch.org'
    )
  );

-- Public read access for some data (for unsubscribe functionality)
CREATE POLICY "Public read access to newsletter_subscribers for unsubscribe" ON newsletter_subscribers
  FOR SELECT USING (TRUE);

-- Insert some default newsletter templates
INSERT INTO newsletter_templates (name, description, html_content, category, is_default) VALUES
(
  'Weekly Update',
  'Standard weekly newsletter layout with announcements and events',
  '<!DOCTYPE html><html><head><title>Weekly Update</title></head><body><h1>Weekly Church Newsletter</h1><div>{{content}}</div></body></html>',
  'general',
  TRUE
),
(
  'Event Announcement',
  'Special event-focused newsletter with large imagery',
  '<!DOCTYPE html><html><head><title>Event Announcement</title></head><body><div class="hero-section"><h1>Special Event</h1></div><div>{{content}}</div></body></html>',
  'event',
  FALSE
),
(
  'Ministry Spotlight',
  'Feature specific ministries and testimonials',
  '<!DOCTYPE html><html><head><title>Ministry Spotlight</title></head><body><div class="ministry-header"><h1>Ministry Focus</h1></div><div>{{content}}</div></body></html>',
  'ministry',
  FALSE
),
(
  'Seasonal Special',
  'Holiday and seasonal themed newsletter',
  '<!DOCTYPE html><html><head><title>Seasonal Newsletter</title></head><body><div class="seasonal-header"><h1>Seasonal Greetings</h1></div><div>{{content}}</div></body></html>',
  'seasonal',
  FALSE
);

-- Insert default newsletter segments
INSERT INTO newsletter_segments (name, description, criteria, is_dynamic) VALUES
(
  'All Subscribers',
  'All active newsletter subscribers',
  '{"status": "active"}',
  TRUE
),
(
  'Church Members',
  'Confirmed church members',
  '{"segments": {"contains": ["members"]}}',
  TRUE
),
(
  'Visitors & Guests',
  'First-time visitors and guests',
  '{"segments": {"contains": ["visitors"]}}',
  TRUE
),
(
  'Youth & Young Adults',
  'Youth ministry and young adults',
  '{"segments": {"contains": ["youth"]}}',
  TRUE
),
(
  'Ministry Leaders',
  'Leadership team and ministry leaders',
  '{"segments": {"contains": ["ministry_leaders"]}}',
  TRUE
),
(
  'Volunteers',
  'Active church volunteers',
  '{"segments": {"contains": ["volunteers"]}}',
  TRUE
);

-- Insert default newsletter settings
INSERT INTO newsletter_settings (setting_key, setting_value, description) VALUES
(
  'default_sender_name',
  '"DOCM Church"',
  'Default sender name for newsletters'
),
(
  'default_sender_email',
  '"newsletter@docmchurch.org"',
  'Default sender email address'
),
(
  'default_reply_to',
  '"admin@docmchurch.org"',
  'Default reply-to email address'
),
(
  'unsubscribe_url',
  '"https://docmchurch.org/unsubscribe"',
  'Base URL for unsubscribe links'
),
(
  'tracking_domain',
  '"track.docmchurch.org"',
  'Domain for click and open tracking'
),
(
  'max_daily_sends',
  '5000',
  'Maximum number of emails to send per day'
),
(
  'default_timezone',
  '"America/Los_Angeles"',
  'Default timezone for scheduling newsletters'
); 