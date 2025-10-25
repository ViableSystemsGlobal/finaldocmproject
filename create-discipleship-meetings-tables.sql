-- Create discipleship meetings tables
-- Run this in your Supabase Dashboard > SQL Editor

-- Create discipleship_meetings table
CREATE TABLE IF NOT EXISTS discipleship_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipleship_group_id UUID NOT NULL REFERENCES discipleship_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  meeting_type TEXT DEFAULT 'regular' CHECK (meeting_type IN ('regular', 'special', 'planning', 'social', 'outreach')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  agenda JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discipleship_meeting_attendance table
CREATE TABLE IF NOT EXISTS discipleship_meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES discipleship_meetings(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  checked_in_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, contact_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discipleship_meetings_group_date ON discipleship_meetings(discipleship_group_id, meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting ON discipleship_meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_contact ON discipleship_meeting_attendance(contact_id);

-- Disable RLS for development (you can enable it later with proper policies)
ALTER TABLE discipleship_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_meeting_attendance DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON discipleship_meetings TO anon, authenticated, service_role;
GRANT ALL ON discipleship_meeting_attendance TO anon, authenticated, service_role;

-- Add some sample meeting data for testing
DO $$
DECLARE
    group_id UUID;
    contact_id UUID;
BEGIN
    -- Get the first discipleship group for testing
    SELECT id INTO group_id FROM discipleship_groups LIMIT 1;
    
    IF group_id IS NOT NULL THEN
        -- Insert sample meetings
        INSERT INTO discipleship_meetings (discipleship_group_id, title, description, meeting_date, start_time, location, meeting_type, status)
        VALUES 
        (group_id, 'Introduction to Discipleship', 'Welcome session for new group members', CURRENT_DATE - INTERVAL '14 days', '19:00', 'Church Main Hall', 'regular', 'completed'),
        (group_id, 'Building Strong Foundations', 'Study on the fundamentals of faith', CURRENT_DATE - INTERVAL '7 days', '19:00', 'Church Main Hall', 'regular', 'completed'),
        (group_id, 'Prayer and Worship Deep Dive', 'Exploring different forms of prayer and worship', CURRENT_DATE + INTERVAL '7 days', '19:00', 'Church Main Hall', 'regular', 'scheduled'),
        (group_id, 'Community Service Planning', 'Planning our next outreach event', CURRENT_DATE + INTERVAL '14 days', '19:00', 'Church Main Hall', 'planning', 'scheduled');
        
        -- Get a sample contact for attendance
        SELECT id INTO contact_id FROM contacts LIMIT 1;
        
        -- Add sample attendance for completed meetings
        IF contact_id IS NOT NULL THEN
            INSERT INTO discipleship_meeting_attendance (meeting_id, contact_id, status, checked_in_at)
            SELECT m.id, contact_id, 'present', m.meeting_date + m.start_time
            FROM discipleship_meetings m 
            WHERE m.discipleship_group_id = group_id AND m.status = 'completed';
        END IF;
    END IF;
END $$;

-- Verify tables were created
SELECT 
    'Discipleship meetings tables created successfully!' as status,
    (SELECT COUNT(*) FROM discipleship_meetings) as sample_meetings,
    (SELECT COUNT(*) FROM discipleship_meeting_attendance) as sample_attendance; 