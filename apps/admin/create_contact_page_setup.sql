-- ===========================
-- Contact Page Setup Script
-- Creates the contact page and all associated sections
-- ===========================

-- First, ensure we have the contact page
INSERT INTO pages (id, slug, title, seo_meta, published_at, created_at, updated_at)
VALUES (
  'contact-page-001',
  'contact',
  'Contact Page',
  '{
    "title": "Contact Demonstration of Christ Church",
    "description": "Get in touch with our church community. Send us a message, call us, or visit us in person. We''re here to listen and support you on your journey.",
    "image_url": ""
  }'::jsonb,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  seo_meta = EXCLUDED.seo_meta,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- Clear existing contact page sections
DELETE FROM page_sections WHERE page_id = 'contact-page-001';

-- Contact Hero Section
INSERT INTO page_sections (id, page_id, type, "order", props, created_at)
VALUES (
  'contact-hero-001',
  'contact-page-001',
  'hero',
  0,
  '{
    "heading": "Let''s connect and start a meaningful conversation.",
    "subheading": "We''d Love to Hear from You",
    "description": "Whether you have questions about faith, want to learn more about our church, need prayer, or just want to connect with our community, we''re here to listen and support you on your journey.",
    "backgroundImage": "https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/uploadmedia/contact-hero-bg.jpg",
    "backgroundMedia": {
      "url": "https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/uploadmedia/contact-hero-bg.jpg",
      "type": "image",
      "alt_text": "People connecting in prayer and fellowship"
    },
    "ctaButtons": [
      {
        "text": "Send a Message",
        "link": "#contact-form",
        "style": "primary"
      },
      {
        "text": "Visit Us",
        "link": "#office-hours",
        "style": "secondary"
      }
    ]
  }'::jsonb,
  NOW()
);

-- Contact Form Section
INSERT INTO page_sections (id, page_id, type, "order", props, created_at)
VALUES (
  'contact-form-001',
  'contact-page-001',
  'contact_form',
  1,
  '{
    "sectionTitle": "Send us a Message",
    "sectionHeading": "Get In Touch",
    "sectionDescription": "We''d love to hear from you. Whether you have questions, need prayer, or want to learn more about our community, send us a message and we''ll respond as soon as possible.",
    "urgentContactPhone": "+1-720-555-0123",
    "urgentContactDescription": "For pastoral emergencies, urgent prayer needs, or immediate spiritual care",
    "responseTimeText": "We typically respond within 24 hours during business days",
    "categories": [
      "General Inquiry",
      "Prayer Request",
      "Pastoral Care",
      "Youth Ministry",
      "Worship & Music Ministry",
      "Community Outreach",
      "Events & Facilities",
      "Missions & Global Outreach",
      "New Member Information",
      "Volunteer Opportunities",
      "Other"
    ]
  }'::jsonb,
  NOW()
);

-- Contact Info Section
INSERT INTO page_sections (id, page_id, type, "order", props, created_at)
VALUES (
  'contact-info-001',
  'contact-page-001',
  'contact_info',
  2,
  '{
    "phone": "(720) 555-0123",
    "email": "hello@docmchurch.org",
    "address": "1234 Faith Avenue, Aurora, CO 80014",
    "office_hours": {
      "weekdays": "Monday - Friday: 9:00 AM - 5:00 PM",
      "weekends": "Saturday: 10:00 AM - 2:00 PM | Sunday: After Services"
    },
    "social_media": [
      {
        "platform": "Facebook",
        "url": "https://facebook.com/docmchurch"
      },
      {
        "platform": "Instagram", 
        "url": "https://instagram.com/docmchurch"
      },
      {
        "platform": "YouTube",
        "url": "https://youtube.com/@docmchurch"
      },
      {
        "platform": "Twitter",
        "url": "https://twitter.com/docmchurch"
      }
    ]
  }'::jsonb,
  NOW()
);

-- Contact CTA Section
INSERT INTO page_sections (id, page_id, type, "order", props, created_at)
VALUES (
  'contact-cta-001',
  'contact-page-001',
  'contact_cta',
  3,
  '{
    "sectionTitle": "Connect With Our Community",
    "sectionHeading": "Ready to take the next step in your faith journey?",
    "sectionDescription": "Whether you''re new to faith, seeking community, or looking to grow deeper in your relationship with God, we''re here to walk alongside you. Join us this Sunday or connect with us anytime.",
    "ctaButtons": [
      {
        "text": "Plan Your Visit",
        "link": "/events",
        "style": "primary"
      },
      {
        "text": "Start a Conversation",
        "link": "#contact-form", 
        "style": "secondary"
      }
    ],
    "features": [
      {
        "text": "All are welcome",
        "icon": "check"
      },
      {
        "text": "No pressure environment",
        "icon": "check"
      },
      {
        "text": "Come as you are",
        "icon": "check"
      },
      {
        "text": "Family-friendly",
        "icon": "check"
      }
    ]
  }'::jsonb,
  NOW()
);

-- Verify the contact page setup
SELECT 
  p.slug,
  p.title,
  p.published_at IS NOT NULL as is_published,
  COUNT(ps.id) as section_count
FROM pages p
LEFT JOIN page_sections ps ON p.id = ps.page_id
WHERE p.slug = 'contact'
GROUP BY p.id, p.slug, p.title, p.published_at;

-- Show all contact page sections
SELECT 
  ps.type,
  ps."order",
  ps.props ->> 'sectionHeading' as heading,
  ps.props ->> 'heading' as hero_heading,
  LENGTH(ps.props::text) as props_size
FROM page_sections ps
JOIN pages p ON ps.page_id = p.id
WHERE p.slug = 'contact'
ORDER BY ps."order"; 