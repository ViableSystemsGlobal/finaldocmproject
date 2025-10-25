-- Fix Communications Templates in Public Schema
-- Run this in your Supabase Dashboard > SQL Editor
-- This will fix the "Error loading templates" issue by creating the table with the correct name

-- Create the templates table with the name "comms.templates" in the public schema
-- This matches how the application is querying: .from('comms.templates')
CREATE TABLE IF NOT EXISTS public."comms.templates" (
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
ALTER TABLE public."comms.templates" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view templates" ON public."comms.templates";
DROP POLICY IF EXISTS "Users can create templates" ON public."comms.templates";
DROP POLICY IF EXISTS "Users can update templates" ON public."comms.templates";
DROP POLICY IF EXISTS "Users can delete templates" ON public."comms.templates";

-- Create RLS policies
CREATE POLICY "Users can view templates" ON public."comms.templates" FOR SELECT USING (true);
CREATE POLICY "Users can create templates" ON public."comms.templates" FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update templates" ON public."comms.templates" FOR UPDATE USING (true);
CREATE POLICY "Users can delete templates" ON public."comms.templates" FOR DELETE USING (true);

-- Insert sample templates for testing
INSERT INTO public."comms.templates" (name, content, channel, type, variables)
VALUES 
    ('Group Welcome Email', 'Welcome to {{group_name}}! We''re excited to have you join us.', 'email', 'group', '{"group_name": "string"}'),
    ('Meeting Reminder SMS', 'Reminder: {{group_name}} meeting tomorrow at {{meeting_time}}.', 'sms', 'group', '{"group_name": "string", "meeting_time": "string"}'),
    ('Event Announcement', 'Join us for {{event_name}} on {{event_date}}. See you there!', 'email', 'announcement', '{"event_name": "string", "event_date": "string"}'),
    ('Weekly Check-in', 'Hi {{first_name}}, how are things going with {{group_name}}?', 'email', 'group', '{"first_name": "string", "group_name": "string"}'),
    ('Prayer Request', 'Please join us in praying for our {{group_name}} community.', 'email', 'group', '{"group_name": "string"}')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON public."comms.templates" TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Templates table created successfully in public schema!' AS status; 