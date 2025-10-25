-- Fix Communications Schema Only
-- Run this in your Supabase Dashboard > SQL Editor
-- This will fix the "Error loading templates: {}" issue

-- Create comms schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS comms;

-- Create message templates table
CREATE TABLE IF NOT EXISTS comms.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
    type TEXT NOT NULL CHECK (type IN ('group', 'individual', 'announcement')),
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on the templates table
ALTER TABLE comms.templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view templates" ON comms.templates;
DROP POLICY IF EXISTS "Users can create templates" ON comms.templates;
DROP POLICY IF EXISTS "Users can update templates" ON comms.templates;
DROP POLICY IF EXISTS "Users can delete templates" ON comms.templates;

-- Create RLS policies
CREATE POLICY "Users can view templates" ON comms.templates FOR SELECT USING (true);
CREATE POLICY "Users can create templates" ON comms.templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update templates" ON comms.templates FOR UPDATE USING (true);
CREATE POLICY "Users can delete templates" ON comms.templates FOR DELETE USING (true);

-- Insert sample templates for testing
INSERT INTO comms.templates (name, content, channel, type, variables)
VALUES 
    ('Group Welcome Email', 'Welcome to {{group_name}}! We''re excited to have you join us.', 'email', 'group', '{"group_name": "string"}'),
    ('Meeting Reminder SMS', 'Reminder: {{group_name}} meeting tomorrow at {{meeting_time}}.', 'sms', 'group', '{"group_name": "string", "meeting_time": "string"}'),
    ('Event Announcement', 'Join us for {{event_name}} on {{event_date}}. See you there!', 'email', 'announcement', '{"event_name": "string", "event_date": "string"}')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA comms TO anon, authenticated;
GRANT ALL ON comms.templates TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Communications schema and templates table created successfully!' AS status; 