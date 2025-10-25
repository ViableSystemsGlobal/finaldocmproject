-- Create communications schema and tables
-- Run this in your Supabase Dashboard > SQL Editor if you get template loading errors

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
    created_by UUID REFERENCES auth.users(id)
);

-- Create messages table for tracking sent messages
CREATE TABLE IF NOT EXISTS comms.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
    content TEXT NOT NULL,
    recipient_ids UUID[] NOT NULL,
    group_id UUID,
    template_id UUID REFERENCES comms.templates(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add some sample templates
INSERT INTO comms.templates (name, content, channel, type) VALUES
('Meeting Reminder', 'Hi {{first_name}}, this is a reminder about our upcoming {{group_name}} meeting on {{meeting_date}} at {{meeting_time}}.', 'email', 'group'),
('Event Announcement', 'Hello {{first_name}}, please join us for a special event with the {{group_name}} group on {{event_date}}.', 'email', 'group'),
('Welcome Message', 'Welcome to {{group_name}}, {{first_name}}! We''re excited to have you join our community.', 'email', 'group'),
('SMS Reminder', 'Reminder: {{group_name}} meeting today at {{meeting_time}}. See you there!', 'sms', 'group'),
('Quick Update', 'Quick update for {{group_name}} members: {{update_message}}', 'sms', 'group')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE comms.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.messages ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth needs)
CREATE POLICY "Users can view templates" ON comms.templates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create messages" ON comms.messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own messages" ON comms.messages
    FOR SELECT USING (created_by = auth.uid());

-- Grant usage on schema
GRANT USAGE ON SCHEMA comms TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA comms TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA comms TO authenticated;

-- Create RPC function for sending group messages (fallback)
CREATE OR REPLACE FUNCTION send_group_message(
    p_channel TEXT,
    p_content TEXT,
    p_group_id UUID,
    p_recipient_ids UUID[]
) RETURNS UUID AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO comms.messages (channel, content, group_id, recipient_ids, created_by)
    VALUES (p_channel, p_content, p_group_id, p_recipient_ids, auth.uid())
    RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 