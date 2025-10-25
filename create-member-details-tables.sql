-- Create tables for member details real data
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Create follow_ups table
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'visit', 'text', 'meeting')),
    notes TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    assigned_to UUID, -- Could reference auth.users or staff table
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    outcome TEXT, -- Result of the follow-up
    next_action TEXT, -- What to do next
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'service' CHECK (event_type IN ('service', 'meeting', 'conference', 'social', 'outreach', 'class', 'other')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    campus_id UUID,
    capacity INTEGER,
    registration_required BOOLEAN DEFAULT FALSE,
    cost DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create event_attendance table
CREATE TABLE IF NOT EXISTS public.event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique attendance per person per event
    UNIQUE(event_id, contact_id)
);

-- 4. Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    donation_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'card', 'bank_transfer', 'online', 'other')),
    fund_designation TEXT DEFAULT 'general', -- general, building, missions, etc.
    reference_number TEXT, -- Check number, transaction ID, etc.
    notes TEXT,
    tax_deductible BOOLEAN DEFAULT TRUE,
    acknowledged BOOLEAN DEFAULT FALSE, -- Whether thank you was sent
    acknowledged_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create member_notes table for general notes about members
CREATE TABLE IF NOT EXISTS public.member_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'pastoral', 'administrative', 'ministry', 'discipleship', 'prayer_request')),
    title TEXT,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    is_sensitive BOOLEAN DEFAULT FALSE, -- For pastoral care notes
    tags TEXT[], -- Array of tags for categorization
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view follow_ups" ON public.follow_ups FOR SELECT USING (true);
CREATE POLICY "Users can create follow_ups" ON public.follow_ups FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update follow_ups" ON public.follow_ups FOR UPDATE USING (true);

CREATE POLICY "Users can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update events" ON public.events FOR UPDATE USING (true);

CREATE POLICY "Users can view event_attendance" ON public.event_attendance FOR SELECT USING (true);
CREATE POLICY "Users can create event_attendance" ON public.event_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update event_attendance" ON public.event_attendance FOR UPDATE USING (true);

CREATE POLICY "Users can view donations" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Users can create donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update donations" ON public.donations FOR UPDATE USING (true);

CREATE POLICY "Users can view member_notes" ON public.member_notes FOR SELECT USING (true);
CREATE POLICY "Users can create member_notes" ON public.member_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update member_notes" ON public.member_notes FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON public.follow_ups TO anon, authenticated;
GRANT ALL ON public.events TO anon, authenticated;
GRANT ALL ON public.event_attendance TO anon, authenticated;
GRANT ALL ON public.donations TO anon, authenticated;
GRANT ALL ON public.member_notes TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact_id ON public.follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_date ON public.follow_ups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_completed ON public.follow_ups(completed);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

CREATE INDEX IF NOT EXISTS idx_event_attendance_contact_id ON public.event_attendance(contact_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_checked_in ON public.event_attendance(checked_in);

CREATE INDEX IF NOT EXISTS idx_donations_contact_id ON public.donations(contact_id);
CREATE INDEX IF NOT EXISTS idx_donations_donation_date ON public.donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_amount ON public.donations(amount);

CREATE INDEX IF NOT EXISTS idx_member_notes_contact_id ON public.member_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_note_type ON public.member_notes(note_type);

-- Add some sample data to test the functionality
DO $$
DECLARE
    sample_contact_id UUID;
    sample_event_id UUID;
    sunday_service_id UUID;
    prayer_meeting_id UUID;
BEGIN
    -- Get a sample contact ID (first contact from the table)
    SELECT id INTO sample_contact_id FROM contacts LIMIT 1;
    
    IF sample_contact_id IS NOT NULL THEN
        -- Insert sample events
        INSERT INTO events (title, description, event_type, start_date, end_date, location) VALUES
        ('Sunday Morning Service', 'Weekly Sunday worship service', 'service', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 hours', 'Main Sanctuary'),
        ('Sunday Morning Service', 'Weekly Sunday worship service', 'service', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '2 hours', 'Main Sanctuary'),
        ('Prayer Meeting', 'Midweek prayer gathering', 'meeting', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '1 hour', 'Fellowship Hall'),
        ('Leadership Conference', 'Annual leadership training', 'conference', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 'Conference Center')
        RETURNING id INTO sample_event_id;
        
        -- Get specific event IDs for attendance
        SELECT id INTO sunday_service_id FROM events WHERE title = 'Sunday Morning Service' AND start_date = (NOW() - INTERVAL '7 days')::date LIMIT 1;
        SELECT id INTO prayer_meeting_id FROM events WHERE title = 'Prayer Meeting' LIMIT 1;
        
        -- Insert sample attendance records
        INSERT INTO event_attendance (event_id, contact_id, checked_in, check_in_time) VALUES
        (sunday_service_id, sample_contact_id, true, NOW() - INTERVAL '7 days' + INTERVAL '10 minutes'),
        (prayer_meeting_id, sample_contact_id, true, NOW() - INTERVAL '10 days' + INTERVAL '5 minutes');
        
        -- Insert sample follow-ups
        INSERT INTO follow_ups (contact_id, type, notes, scheduled_date, completed, completed_at) VALUES
        (sample_contact_id, 'call', 'Follow up on ministry interest in youth group', NOW() - INTERVAL '5 days', true, NOW() - INTERVAL '5 days'),
        (sample_contact_id, 'email', 'Send information about upcoming discipleship program', NOW() + INTERVAL '3 days', false, NULL),
        (sample_contact_id, 'visit', 'Home visit to discuss family needs', NOW() + INTERVAL '7 days', false, NULL);
        
        -- Insert sample donations
        INSERT INTO donations (contact_id, amount, donation_date, payment_method, fund_designation) VALUES
        (sample_contact_id, 100.00, NOW()::date - INTERVAL '30 days', 'online', 'general'),
        (sample_contact_id, 250.00, NOW()::date - INTERVAL '60 days', 'check', 'general'),
        (sample_contact_id, 50.00, NOW()::date - INTERVAL '90 days', 'cash', 'missions');
        
        -- Insert sample member notes
        INSERT INTO member_notes (contact_id, note_type, title, content, tags) VALUES
        (sample_contact_id, 'ministry', 'Interest in Youth Ministry', 'Expressed strong interest in helping with youth programs, has background in education', ARRAY['youth', 'ministry', 'education']),
        (sample_contact_id, 'general', 'Family Update', 'Recently moved to the area, looking to get more involved in church community', ARRAY['new_member', 'family']);
    END IF;
END
$$;

SELECT 'Member details tables created successfully with sample data!' AS status; 