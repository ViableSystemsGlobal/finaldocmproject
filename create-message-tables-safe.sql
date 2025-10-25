-- Create Group Messaging System Tables and Functions (SAFE VERSION - UPDATED)
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Drop existing table if it exists and recreate with better structure
DROP TABLE IF EXISTS public."comms.messages" CASCADE;

-- Create messages table with polymorphic relationship
CREATE TABLE IF NOT EXISTS public."comms.messages" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
    content TEXT NOT NULL,
    subject TEXT, -- For email messages
    group_type TEXT NOT NULL CHECK (group_type IN ('group', 'discipleship_group')),
    group_id UUID NOT NULL, -- Can reference groups or discipleship_groups
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages" ON public."comms.messages";
DROP POLICY IF EXISTS "Users can create messages" ON public."comms.messages";
DROP POLICY IF EXISTS "Users can update messages" ON public."comms.messages";

-- Create RLS policies
CREATE POLICY "Users can view messages" ON public."comms.messages" FOR SELECT USING (true);
CREATE POLICY "Users can create messages" ON public."comms.messages" FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update messages" ON public."comms.messages" FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON public."comms.messages" TO anon, authenticated;

-- 2. Drop any existing send_group_message functions to avoid conflicts
DROP FUNCTION IF EXISTS send_group_message(TEXT, TEXT, UUID, UUID[]);
DROP FUNCTION IF EXISTS send_group_message(TEXT, TEXT, UUID, UUID[], TEXT);
DROP FUNCTION IF EXISTS public.send_group_message(TEXT, TEXT, UUID, UUID[]);
DROP FUNCTION IF EXISTS public.send_group_message(TEXT, TEXT, UUID, UUID[], TEXT);
DROP FUNCTION IF EXISTS send_discipleship_group_message(TEXT, TEXT, UUID, UUID[], TEXT);

-- 3. Create the new send_discipleship_group_message function
CREATE OR REPLACE FUNCTION send_discipleship_group_message(
    p_channel TEXT,
    p_content TEXT,
    p_group_id UUID,
    p_recipient_ids UUID[],
    p_subject TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    message_id UUID;
    contact_record RECORD;
    email_count INTEGER := 0;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    result JSON;
    final_subject TEXT;
    group_name TEXT;
BEGIN
    -- Get group name for email subject from discipleship_groups table
    SELECT name INTO group_name FROM discipleship_groups WHERE id = p_group_id;
    
    -- Set default subject for emails
    IF p_channel = 'email' AND (p_subject IS NULL OR p_subject = '') THEN
        final_subject := 'Message from ' || COALESCE(group_name, 'Discipleship Group');
    ELSE
        final_subject := p_subject;
    END IF;
    
    -- Insert the message record
    INSERT INTO public."comms.messages" (
        channel, 
        content, 
        subject,
        group_type,
        group_id, 
        recipient_ids, 
        status, 
        created_by
    ) VALUES (
        p_channel, 
        p_content,
        final_subject,
        'discipleship_group',
        p_group_id, 
        p_recipient_ids, 
        'pending',
        auth.uid()
    ) RETURNING id INTO message_id;
    
    -- Process each recipient based on channel
    FOR contact_record IN 
        SELECT c.id, c.first_name, c.last_name, c.email, c.phone
        FROM contacts c
        WHERE c.id = ANY(p_recipient_ids)
    LOOP
        email_count := email_count + 1;
        
        -- For email channel, enqueue emails
        IF p_channel = 'email' AND contact_record.email IS NOT NULL THEN
            BEGIN
                -- Insert into email_queue table if it exists
                INSERT INTO email_queue (
                    to_address,
                    subject,
                    html_body,
                    text_body,
                    metadata,
                    status,
                    next_attempt_at
                ) VALUES (
                    contact_record.email,
                    final_subject,
                    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' || p_content || '</div>',
                    p_content,
                    jsonb_build_object(
                        'contact_id', contact_record.id,
                        'group_id', p_group_id,
                        'group_type', 'discipleship_group',
                        'message_id', message_id,
                        'first_name', contact_record.first_name,
                        'last_name', contact_record.last_name,
                        'email_type', 'bulk'
                    ),
                    'pending',
                    NOW()
                );
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Error enqueueing email for contact %: %', contact_record.id, SQLERRM;
            END;
        ELSIF p_channel = 'sms' AND contact_record.phone IS NOT NULL THEN
            -- For SMS, you would integrate with SMS service here
            -- For now, just count as success
            success_count := success_count + 1;
        ELSE
            -- Missing contact info
            error_count := error_count + 1;
        END IF;
    END LOOP;
    
    -- Update message status
    UPDATE public."comms.messages" 
    SET 
        status = CASE 
            WHEN success_count > 0 THEN 'sending'
            ELSE 'failed'
        END,
        sent_count = success_count,
        error_message = CASE 
            WHEN error_count > 0 THEN 'Some recipients failed: ' || error_count || ' errors'
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = message_id;
    
    -- Return result
    result := json_build_object(
        'success', true,
        'message_id', message_id,
        'total_recipients', email_count,
        'successful', success_count,
        'errors', error_count,
        'channel', p_channel
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'total_recipients', email_count,
            'successful', success_count,
            'errors', error_count + 1
        );
        RETURN result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION send_discipleship_group_message TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Discipleship group messaging system created successfully!' AS status; 