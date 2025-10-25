-- Fix Group Messaging Database Table
-- Run this in your Supabase Dashboard > SQL Editor to fix the "Failed to record message in history" error

-- Create the messages table with quoted name to match the code
CREATE TABLE IF NOT EXISTS public."comms.messages" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
    content TEXT NOT NULL,
    subject TEXT, -- For email messages
    group_type TEXT NOT NULL DEFAULT 'discipleship_group' CHECK (group_type IN ('group', 'discipleship_group')),
    group_id UUID NOT NULL,
    recipient_ids UUID[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    sent_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public."comms.messages" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages" ON public."comms.messages";
DROP POLICY IF EXISTS "Users can create messages" ON public."comms.messages";
DROP POLICY IF EXISTS "Users can update messages" ON public."comms.messages";

-- Create RLS policies
CREATE POLICY "Users can view messages" ON public."comms.messages" 
    FOR SELECT USING (true);

CREATE POLICY "Users can create messages" ON public."comms.messages" 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update messages" ON public."comms.messages" 
    FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON public."comms.messages" TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "comms_messages_group_id_idx" ON public."comms.messages"(group_id);
CREATE INDEX IF NOT EXISTS "comms_messages_status_idx" ON public."comms.messages"(status);
CREATE INDEX IF NOT EXISTS "comms_messages_created_at_idx" ON public."comms.messages"(created_at);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Display success message
SELECT 'Group messaging table created successfully! The "Failed to record message in history" error should now be fixed.' AS status; 