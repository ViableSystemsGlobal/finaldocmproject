-- Create a function to count subscribers by segment
CREATE OR REPLACE FUNCTION count_subscribers_by_segment(segment_key TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM newsletter_subscribers
    WHERE status = 'active' 
    AND segments ? segment_key
  );
END;
$$ LANGUAGE plpgsql;

-- Add sample newsletter subscribers
INSERT INTO newsletter_subscribers (email, first_name, last_name, status, segments, subscription_source) VALUES
('john.doe@example.com', 'John', 'Doe', 'active', '["members"]', 'website'),
('jane.smith@example.com', 'Jane', 'Smith', 'active', '["members", "volunteers"]', 'website'),
('mike.johnson@example.com', 'Mike', 'Johnson', 'active', '["visitors"]', 'manual'),
('sarah.wilson@example.com', 'Sarah', 'Wilson', 'active', '["members", "ministry_leaders"]', 'website'),
('david.brown@example.com', 'David', 'Brown', 'active', '["youth"]', 'website'),
('emily.davis@example.com', 'Emily', 'Davis', 'active', '["members", "volunteers"]', 'import'),
('robert.miller@example.com', 'Robert', 'Miller', 'active', '["visitors"]', 'website'),
('lisa.anderson@example.com', 'Lisa', 'Anderson', 'active', '["members"]', 'website'),
('james.taylor@example.com', 'James', 'Taylor', 'unsubscribed', '["members"]', 'website'),
('mary.thomas@example.com', 'Mary', 'Thomas', 'active', '["youth", "volunteers"]', 'website'),
('william.jackson@example.com', 'William', 'Jackson', 'active', '["ministry_leaders"]', 'manual'),
('jennifer.white@example.com', 'Jennifer', 'White', 'active', '["members", "volunteers"]', 'website'),
('michael.harris@example.com', 'Michael', 'Harris', 'active', '["visitors"]', 'website'),
('linda.martin@example.com', 'Linda', 'Martin', 'active', '["members"]', 'import'),
('christopher.garcia@example.com', 'Christopher', 'Garcia', 'bounced', '["youth"]', 'website'),
('barbara.rodriguez@example.com', 'Barbara', 'Rodriguez', 'active', '["members", "ministry_leaders"]', 'website'),
('matthew.lee@example.com', 'Matthew', 'Lee', 'active', '["volunteers"]', 'manual'),
('susan.gonzalez@example.com', 'Susan', 'Gonzalez', 'active', '["members"]', 'website'),
('daniel.wilson@example.com', 'Daniel', 'Wilson', 'active', '["youth"]', 'website'),
('nancy.moore@example.com', 'Nancy', 'Moore', 'active', '["members", "volunteers"]', 'website');

-- Add some sample newsletters
INSERT INTO newsletters (subject, preheader, content, status, target_audience, total_recipients, total_opened, total_clicked, sent_at, created_by) VALUES
(
  'Welcome to December - Christmas Celebration',
  'Join us for our special Christmas service and community events',
  'Dear Church Family,

As we enter the beautiful month of December, we are excited to share the joy of Christmas with our community. 

Our Christmas service will be held on December 24th at 7:00 PM. We will have special music, a candlelight ceremony, and a powerful message about the birth of our Savior.

Additionally, we are organizing a community outreach program to help local families in need. If you would like to volunteer or donate, please contact our ministry team.

May this season bring you peace, joy, and the love of Christ.

Blessings,
Pastor John',
  'sent',
  'all',
  18,
  12,
  3,
  NOW() - INTERVAL '2 days',
  (SELECT id FROM auth.users WHERE email = 'admin@docmchurch.org' LIMIT 1)
),
(
  'Youth Ministry Winter Retreat',
  'Early bird registration now open for our youth winter retreat',
  'Calling all youth and young adults!

Our annual winter retreat is coming up on January 15-17, 2025. This year we are going to Mountain View Camp for three days of worship, fellowship, and fun in the snow.

Activities include:
- Daily worship sessions
- Small group discussions
- Skiing and snowboarding
- Campfire sessions
- Team building activities

Early bird registration is $150 (regular price $200). Register by December 15th to secure your spot!

Contact youth@docmchurch.org for more information.

God bless,
Youth Ministry Team',
  'scheduled',
  'segment',
  5,
  0,
  0,
  NOW() + INTERVAL '1 week',
  (SELECT id FROM auth.users WHERE email = 'admin@docmchurch.org' LIMIT 1)
),
(
  'Thanksgiving Service Recap',
  'Thank you for making our Thanksgiving service so special',
  'Dear DOCM Family,

What a wonderful Thanksgiving service we had! It was truly heartwarming to see so many of you come together to give thanks and celebrate God''s blessings.

Highlights from our service:
- Over 200 attendees
- $5,000 raised for local food bank
- Beautiful musical performances
- Meaningful testimonies shared

The community dinner that followed was also a huge success. Thank you to all the volunteers who helped prepare and serve the meal.

We are truly grateful for each and every one of you. Your faithfulness and generosity continue to make DOCM a place where God''s love shines bright.

With gratitude,
DOCM Leadership Team',
  'sent',
  'all',
  18,
  15,
  7,
  NOW() - INTERVAL '1 week',
  (SELECT id FROM auth.users WHERE email = 'admin@docmchurch.org' LIMIT 1)
);

-- Update segment subscriber counts using the function
UPDATE newsletter_segments 
SET subscriber_count = (
  SELECT COUNT(*) 
  FROM newsletter_subscribers 
  WHERE status = 'active'
) 
WHERE name = 'All Subscribers';

UPDATE newsletter_segments 
SET subscriber_count = count_subscribers_by_segment('members')
WHERE name = 'Church Members';

UPDATE newsletter_segments 
SET subscriber_count = count_subscribers_by_segment('visitors')
WHERE name = 'Visitors & Guests';

UPDATE newsletter_segments 
SET subscriber_count = count_subscribers_by_segment('youth')
WHERE name = 'Youth & Young Adults';

UPDATE newsletter_segments 
SET subscriber_count = count_subscribers_by_segment('ministry_leaders')
WHERE name = 'Ministry Leaders';

UPDATE newsletter_segments 
SET subscriber_count = count_subscribers_by_segment('volunteers')
WHERE name = 'Volunteers'; 