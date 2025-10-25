-- Create Website Messages System (Simplified)
-- Run this in your Supabase Dashboard > SQL Editor

-- Create website_messages table without foreign key constraints
CREATE TABLE IF NOT EXISTS public.website_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    source TEXT DEFAULT 'website', -- website, contact_form, etc.
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded', 'archived')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT, -- general, prayer_request, visit_inquiry, etc.
    assigned_to UUID, -- References auth.users(id) but without FK constraint
    response_notes TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID, -- References auth.users(id) but without FK constraint
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.website_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view website messages" ON public.website_messages FOR SELECT USING (true);
CREATE POLICY "Users can create website messages" ON public.website_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update website messages" ON public.website_messages FOR UPDATE USING (true);
CREATE POLICY "Users can delete website messages" ON public.website_messages FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON public.website_messages TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_messages_status ON public.website_messages(status);
CREATE INDEX IF NOT EXISTS idx_website_messages_created_at ON public.website_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_messages_assigned_to ON public.website_messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_website_messages_category ON public.website_messages(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_website_messages_updated_at 
    BEFORE UPDATE ON public.website_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get website messages metrics
CREATE OR REPLACE FUNCTION get_website_messages_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalMessages', (SELECT COUNT(*) FROM website_messages),
        'unreadMessages', (SELECT COUNT(*) FROM website_messages WHERE status = 'unread'),
        'respondedToday', (SELECT COUNT(*) FROM website_messages WHERE status = 'responded' AND responded_at >= CURRENT_DATE),
        'highPriorityMessages', (SELECT COUNT(*) FROM website_messages WHERE priority IN ('high', 'urgent') AND status != 'archived'),
        'error', null
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_website_messages_metrics() TO anon, authenticated;

-- Insert some sample data for testing
INSERT INTO public.website_messages (name, email, phone, subject, message, category, priority) VALUES
('John Smith', 'john.smith@email.com', '+1234567890', 'Visiting this Sunday', 'Hi, I would like to visit your church this Sunday. What time do services start?', 'visit_inquiry', 'normal'),
('Mary Johnson', 'mary.j@email.com', NULL, 'Prayer Request', 'Please pray for my family during this difficult time. Thank you.', 'prayer_request', 'high'),
('David Wilson', 'david.w@email.com', '+1987654321', 'General Inquiry', 'I am new to the area and looking for a church home. Can you tell me more about your ministries?', 'general', 'normal'),
('Sarah Brown', 'sarah.brown@email.com', '+1122334455', 'Volunteer Opportunity', 'I would like to volunteer with your youth ministry. How can I get involved?', 'volunteer', 'normal'),
('Michael Davis', 'mike.davis@email.com', NULL, 'Urgent - Need Help', 'I am going through a crisis and need someone to talk to. Please contact me as soon as possible.', 'crisis', 'urgent'); 