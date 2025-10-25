-- Fix member details tables to match the code expectations
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Add missing columns to existing tables
DO $$
BEGIN
    -- Add scheduled_date to follow_ups if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follow_ups' AND column_name = 'scheduled_date') THEN
        ALTER TABLE follow_ups ADD COLUMN scheduled_date TIMESTAMP WITH TIME ZONE;
        -- Copy data from next_action_date if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follow_ups' AND column_name = 'next_action_date') THEN
            UPDATE follow_ups SET scheduled_date = next_action_date WHERE scheduled_date IS NULL;
        END IF;
    END IF;

    -- Add completed column to follow_ups if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follow_ups' AND column_name = 'completed') THEN
        ALTER TABLE follow_ups ADD COLUMN completed BOOLEAN DEFAULT FALSE;
        -- Set completed based on status if available
        UPDATE follow_ups SET completed = (status = 'completed') WHERE completed IS NULL;
    END IF;

    -- Add priority column to follow_ups if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follow_ups' AND column_name = 'priority') THEN
        ALTER TABLE follow_ups ADD COLUMN priority VARCHAR(10) DEFAULT 'medium';
    END IF;

    -- Add title column to events if it doesn't exist (alias for name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'title') THEN
        ALTER TABLE events ADD COLUMN title TEXT;
        -- Copy data from name if it exists
        UPDATE events SET title = name WHERE title IS NULL;
    END IF;

    -- Add start_date column to events if it doesn't exist (alias for event_date)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'start_date') THEN
        ALTER TABLE events ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
        -- Copy data from event_date if it exists
        UPDATE events SET start_date = event_date WHERE start_date IS NULL;
    END IF;

    -- Add event_type column to events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
        ALTER TABLE events ADD COLUMN event_type VARCHAR(50) DEFAULT 'service';
    END IF;

    -- Add description column to groups if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'description') THEN
        ALTER TABLE groups ADD COLUMN description TEXT;
    END IF;
END
$$;

-- 2. Create missing tables

-- Create event_attendance table
CREATE TABLE IF NOT EXISTS event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, contact_id)
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    donation_date DATE NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    fund_designation VARCHAR(50) DEFAULT 'general',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member_notes table
CREATE TABLE IF NOT EXISTS member_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    note_type VARCHAR(20) DEFAULT 'general',
    title TEXT,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Disable RLS for development (you can enable it later)
ALTER TABLE follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships DISABLE ROW LEVEL SECURITY;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact_scheduled ON follow_ups(contact_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_event_attendance_contact ON event_attendance(contact_id);
CREATE INDEX IF NOT EXISTS idx_donations_contact_date ON donations(contact_id, donation_date);
CREATE INDEX IF NOT EXISTS idx_member_notes_contact ON member_notes(contact_id);

-- Verify everything was created successfully
SELECT 
    'Tables and columns updated successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('follow_ups', 'events', 'event_attendance', 'donations', 'member_notes', 'groups', 'group_memberships')) as total_tables; 