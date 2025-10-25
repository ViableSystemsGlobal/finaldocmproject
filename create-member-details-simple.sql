-- Simple member details tables creation
-- Run this in your Supabase Dashboard > SQL Editor

-- First, let's check if the tables exist and drop them if they do
DROP TABLE IF EXISTS public.event_attendance CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.follow_ups CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.member_notes CASCADE;

-- 1. Create events table (simplified)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    event_type TEXT DEFAULT 'service',
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create follow_ups table (simplified)  
CREATE TABLE public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'call',
    notes TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create event_attendance table
CREATE TABLE public.event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMPTZ,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, contact_id)
);

-- 4. Create donations table
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    donation_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    fund_designation TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create member_notes table
CREATE TABLE public.member_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general',
    title TEXT,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for simplicity (enable later if needed)
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.events TO anon, authenticated, service_role;
GRANT ALL ON public.follow_ups TO anon, authenticated, service_role;
GRANT ALL ON public.event_attendance TO anon, authenticated, service_role;
GRANT ALL ON public.donations TO anon, authenticated, service_role;
GRANT ALL ON public.member_notes TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX idx_follow_ups_contact_id ON public.follow_ups(contact_id);
CREATE INDEX idx_event_attendance_contact_id ON public.event_attendance(contact_id);
CREATE INDEX idx_donations_contact_id ON public.donations(contact_id);
CREATE INDEX idx_member_notes_contact_id ON public.member_notes(contact_id);

-- Insert sample data for testing
DO $$
DECLARE
    contact1_id UUID := '1e1f63ae-02e5-4e54-a13e-30b5a7858008'; -- Kwame Mensah
    contact2_id UUID := '12f2dcac-0b99-4c07-8164-0a3d4b469a16'; -- Nana Yaw
    event1_id UUID;
    event2_id UUID;
BEGIN
    -- Insert sample events
    INSERT INTO events (title, start_date, event_type, location, description) VALUES
    ('Sunday Morning Service', NOW() - INTERVAL '7 days', 'service', 'Main Sanctuary', 'Weekly worship service')
    RETURNING id INTO event1_id;
    
    INSERT INTO events (title, start_date, event_type, location, description) VALUES
    ('Prayer Meeting', NOW() - INTERVAL '3 days', 'meeting', 'Fellowship Hall', 'Midweek prayer')
    RETURNING id INTO event2_id;
    
    -- Insert sample follow-ups for both contacts
    INSERT INTO follow_ups (contact_id, type, notes, scheduled_date, completed) VALUES
    (contact1_id, 'call', 'Follow up on ministry interest', NOW() + INTERVAL '2 days', false),
    (contact1_id, 'email', 'Send welcome packet', NOW() - INTERVAL '1 day', true),
    (contact2_id, 'visit', 'Home visit for new member', NOW() + INTERVAL '5 days', false);
    
    -- Insert sample attendance
    INSERT INTO event_attendance (event_id, contact_id, checked_in, check_in_time) VALUES
    (event1_id, contact1_id, true, NOW() - INTERVAL '7 days' + INTERVAL '15 minutes'),
    (event2_id, contact1_id, true, NOW() - INTERVAL '3 days' + INTERVAL '10 minutes'),
    (event1_id, contact2_id, true, NOW() - INTERVAL '7 days' + INTERVAL '20 minutes');
    
    -- Insert sample donations
    INSERT INTO donations (contact_id, amount, donation_date, payment_method) VALUES
    (contact1_id, 100.00, NOW()::date - INTERVAL '30 days', 'online'),
    (contact1_id, 75.00, NOW()::date - INTERVAL '60 days', 'cash'),
    (contact2_id, 200.00, NOW()::date - INTERVAL '15 days', 'check');
    
    -- Insert sample notes
    INSERT INTO member_notes (contact_id, note_type, title, content) VALUES
    (contact1_id, 'general', 'New Member Welcome', 'Very enthusiastic about getting involved in ministry'),
    (contact2_id, 'ministry', 'Interest in Youth Work', 'Has experience working with children and teenagers');
    
END
$$;

SELECT 'Member details tables created successfully with sample data!' AS status; 