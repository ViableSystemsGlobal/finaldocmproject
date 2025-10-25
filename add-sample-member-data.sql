-- Add sample member details data to existing tables
-- Run this in your Supabase Dashboard > SQL Editor

DO $$
DECLARE
    contact1_id UUID := '1e1f63ae-02e5-4e54-a13e-30b5a7858008'; -- Kwame Mensah
    contact2_id UUID := '12f2dcac-0b99-4c07-8164-0a3d4b469a16'; -- Nana Yaw
    event1_id UUID;
    event2_id UUID;
    event3_id UUID;
BEGIN
    -- Clear existing sample data to avoid duplicates
    DELETE FROM event_attendance WHERE contact_id IN (contact1_id, contact2_id);
    DELETE FROM donations WHERE contact_id IN (contact1_id, contact2_id);
    DELETE FROM member_notes WHERE contact_id IN (contact1_id, contact2_id);
    
    -- Add more events if they don't exist
    INSERT INTO events (title, start_date, event_type, location, description) VALUES
    ('Sunday Morning Service', NOW() - INTERVAL '7 days', 'service', 'Main Sanctuary', 'Weekly worship service'),
    ('Prayer Meeting', NOW() - INTERVAL '3 days', 'meeting', 'Fellowship Hall', 'Midweek prayer gathering'),
    ('Youth Service', NOW() - INTERVAL '14 days', 'service', 'Youth Hall', 'Special service for young people')
    ON CONFLICT DO NOTHING;
    
    -- Get event IDs
    SELECT id INTO event1_id FROM events WHERE title = 'Sunday Morning Service' LIMIT 1;
    SELECT id INTO event2_id FROM events WHERE title = 'Prayer Meeting' LIMIT 1;
    SELECT id INTO event3_id FROM events WHERE title = 'Youth Service' LIMIT 1;
    
    -- Add sample attendance for Kwame Mensah
    IF event1_id IS NOT NULL THEN
        INSERT INTO event_attendance (event_id, contact_id, checked_in, check_in_time) VALUES
        (event1_id, contact1_id, true, NOW() - INTERVAL '7 days' + INTERVAL '15 minutes')
        ON CONFLICT (event_id, contact_id) DO NOTHING;
    END IF;
    
    IF event2_id IS NOT NULL THEN
        INSERT INTO event_attendance (event_id, contact_id, checked_in, check_in_time) VALUES
        (event2_id, contact1_id, true, NOW() - INTERVAL '3 days' + INTERVAL '10 minutes')
        ON CONFLICT (event_id, contact_id) DO NOTHING;
    END IF;
    
    -- Add sample attendance for Nana Yaw
    IF event1_id IS NOT NULL THEN
        INSERT INTO event_attendance (event_id, contact_id, checked_in, check_in_time) VALUES
        (event1_id, contact2_id, true, NOW() - INTERVAL '7 days' + INTERVAL '20 minutes')
        ON CONFLICT (event_id, contact_id) DO NOTHING;
    END IF;
    
    IF event3_id IS NOT NULL THEN
        INSERT INTO event_attendance (event_id, contact_id, checked_in, check_in_time) VALUES
        (event3_id, contact2_id, true, NOW() - INTERVAL '14 days' + INTERVAL '25 minutes')
        ON CONFLICT (event_id, contact_id) DO NOTHING;
    END IF;
    
    -- Add sample donations for Kwame Mensah
    INSERT INTO donations (contact_id, amount, donation_date, payment_method, fund_designation) VALUES
    (contact1_id, 100.00, NOW()::date - INTERVAL '30 days', 'online', 'general'),
    (contact1_id, 75.00, NOW()::date - INTERVAL '60 days', 'cash', 'general'),
    (contact1_id, 50.00, NOW()::date - INTERVAL '15 days', 'card', 'missions');
    
    -- Add sample donations for Nana Yaw
    INSERT INTO donations (contact_id, amount, donation_date, payment_method, fund_designation) VALUES
    (contact2_id, 200.00, NOW()::date - INTERVAL '15 days', 'check', 'general'),
    (contact2_id, 125.00, NOW()::date - INTERVAL '45 days', 'online', 'building');
    
    -- Add sample member notes for Kwame Mensah
    INSERT INTO member_notes (contact_id, note_type, title, content, is_private) VALUES
    (contact1_id, 'general', 'New Member Welcome', 'Very enthusiastic about getting involved in ministry. Expressed interest in youth work and music ministry.', false),
    (contact1_id, 'ministry', 'Ministry Interest', 'Showed strong interest in joining the worship team. Has musical background with guitar and vocals.', false),
    (contact1_id, 'pastoral', 'Follow-up Needed', 'Requested prayer for family situation. Schedule pastoral visit next week.', false);
    
    -- Add sample member notes for Nana Yaw
    INSERT INTO member_notes (contact_id, note_type, title, content, is_private) VALUES
    (contact2_id, 'general', 'Family Update', 'Recently moved to the area with family. Looking to get more involved in church community.', false),
    (contact2_id, 'ministry', 'Interest in Youth Work', 'Has experience working with children and teenagers. Would be great for youth ministry team.', false);
    
    -- Update some existing follow-ups to be completed and add completion dates
    UPDATE follow_ups 
    SET completed = true, completed_at = NOW() - INTERVAL '2 days'
    WHERE contact_id = contact1_id AND type = 'email';
    
    -- Add more follow-ups
    INSERT INTO follow_ups (contact_id, type, notes, scheduled_date, completed, completed_at, priority) VALUES
    (contact1_id, 'visit', 'Home visit to discuss ministry opportunities', NOW() + INTERVAL '5 days', false, NULL, 'high'),
    (contact2_id, 'call', 'Follow up on youth ministry interest', NOW() + INTERVAL '3 days', false, NULL, 'medium'),
    (contact2_id, 'email', 'Send youth ministry information packet', NOW() - INTERVAL '2 days', true, NOW() - INTERVAL '2 days', 'low');
    
END
$$;

-- Verify the data was inserted
SELECT 
    'Sample data added successfully!' as status,
    (SELECT COUNT(*) FROM event_attendance WHERE contact_id IN ('1e1f63ae-02e5-4e54-a13e-30b5a7858008', '12f2dcac-0b99-4c07-8164-0a3d4b469a16')) as attendance_records,
    (SELECT COUNT(*) FROM donations WHERE contact_id IN ('1e1f63ae-02e5-4e54-a13e-30b5a7858008', '12f2dcac-0b99-4c07-8164-0a3d4b469a16')) as donation_records,
    (SELECT COUNT(*) FROM member_notes WHERE contact_id IN ('1e1f63ae-02e5-4e54-a13e-30b5a7858008', '12f2dcac-0b99-4c07-8164-0a3d4b469a16')) as note_records; 