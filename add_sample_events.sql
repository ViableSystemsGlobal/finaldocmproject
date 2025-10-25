-- Add sample events for testing the mobile app
-- Run this in your Supabase Dashboard > SQL Editor

INSERT INTO public.events (
    title,
    description,
    event_type,
    start_date,
    end_date,
    location,
    capacity,
    registration_required,
    cost,
    status
) VALUES 
(
    'Sunday Morning Worship',
    'Join us for our weekly Sunday morning worship service with inspiring music and Biblical teaching.',
    'service',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days' + INTERVAL '2 hours',
    'Main Sanctuary',
    200,
    false,
    0.00,
    'scheduled'
),
(
    'Youth Bible Study',
    'Weekly Bible study for teens and young adults. Come grow in faith and fellowship!',
    'meeting',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days' + INTERVAL '1.5 hours',
    'Youth Room',
    30,
    false,
    0.00,
    'scheduled'
),
(
    'Annual Church Picnic',
    'Join us for our annual church family picnic with food, games, and fellowship for all ages.',
    'social',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days' + INTERVAL '4 hours',
    'Riverside Park',
    150,
    true,
    5.00,
    'scheduled'
),
(
    'Prayer Meeting',
    'Midweek prayer gathering for the church family. Come as we pray together for our community and world.',
    'meeting',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '10 days' + INTERVAL '1 hour',
    'Fellowship Hall',
    50,
    false,
    0.00,
    'scheduled'
),
(
    'Leadership Conference',
    'Annual leadership training conference for ministry leaders and volunteers.',
    'conference',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '23 days',
    'Conference Center',
    100,
    true,
    25.00,
    'scheduled'
),
(
    'Community Outreach',
    'Join us as we serve our local community with a neighborhood cleanup and free lunch.',
    'outreach',
    NOW() + INTERVAL '28 days',
    NOW() + INTERVAL '28 days' + INTERVAL '4 hours',
    'Downtown Community Center',
    75,
    false,
    0.00,
    'scheduled'
);

SELECT 'Sample events added successfully!' AS status; 