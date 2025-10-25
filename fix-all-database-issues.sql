-- Comprehensive Database Fix Script
-- Run this in your Supabase Dashboard > SQL Editor to fix all console errors
-- This script will:
-- 1. Fix foreign key constraints for discipleship groups
-- 2. Create communications schema for message templates
-- 3. Refresh schema cache

-- ==============================================
-- PART 1: Fix Foreign Key Constraints
-- ==============================================

-- 1. First, ensure all discipleship groups have valid campus_id values
UPDATE discipleship_groups 
SET campus_id = (SELECT id FROM campuses WHERE name = 'Main Campus' LIMIT 1)
WHERE campus_id IS NULL OR campus_id NOT IN (SELECT id FROM campuses);

-- 2. Add foreign key constraint from discipleship_groups to campuses (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discipleship_groups_campus_id_fkey'
        AND table_name = 'discipleship_groups'
    ) THEN
        ALTER TABLE discipleship_groups 
        ADD CONSTRAINT discipleship_groups_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES campuses(id);
        RAISE NOTICE 'Added discipleship_groups_campus_id_fkey constraint';
    ELSE
        RAISE NOTICE 'discipleship_groups_campus_id_fkey constraint already exists';
    END IF;
END $$;

-- 3. Add foreign key constraint from discipleship_groups to contacts (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discipleship_groups_leader_id_fkey'
        AND table_name = 'discipleship_groups'
    ) THEN
        ALTER TABLE discipleship_groups 
        ADD CONSTRAINT discipleship_groups_leader_id_fkey 
        FOREIGN KEY (leader_id) REFERENCES contacts(id);
        RAISE NOTICE 'Added discipleship_groups_leader_id_fkey constraint';
    ELSE
        RAISE NOTICE 'discipleship_groups_leader_id_fkey constraint already exists';
    END IF;
END $$;

-- 4. Add foreign key constraint from groups to campuses (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_campus_id_fkey'
        AND table_name = 'groups'
    ) THEN
        ALTER TABLE groups 
        ADD CONSTRAINT groups_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES campuses(id);
        RAISE NOTICE 'Added groups_campus_id_fkey constraint';
    ELSE
        RAISE NOTICE 'groups_campus_id_fkey constraint already exists';
    END IF;
END $$;

-- ==============================================
-- PART 2: Create Communications Schema
-- ==============================================

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

-- ==============================================
-- PART 3: Refresh Schema Cache
-- ==============================================

-- Refresh PostgREST schema cache to recognize new relationships
NOTIFY pgrst, 'reload schema';

-- Final success message
SELECT 'Database fixes applied successfully! All foreign key constraints and communication schema are now in place.' AS status; 