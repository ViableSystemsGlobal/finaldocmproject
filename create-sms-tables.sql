-- Create SMS-related tables for the application
-- This should be run in your Supabase SQL editor

-- Create SMS messages table
CREATE TABLE IF NOT EXISTS public.sms_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    to_phone text NOT NULL,
    from_phone text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'queued')),
    sent_at timestamptz,
    delivered_at timestamptz,
    failed_at timestamptz,
    error_message text,
    cost numeric(10,4),
    external_id text, -- Twilio SID or other provider ID
    template_id uuid REFERENCES public.comms_templates(id),
    variables jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- Create SMS templates table (if using separate SMS templates)
CREATE TABLE IF NOT EXISTS public.sms_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    message text NOT NULL,
    variables text[], -- Array of variable names like ['name', 'amount']
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    usage_count integer DEFAULT 0
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_sms_messages_updated_at
    BEFORE UPDATE ON public.sms_messages
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_sms_templates_updated_at
    BEFORE UPDATE ON public.sms_templates
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON public.sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON public.sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_phone ON public.sms_messages(to_phone);
CREATE INDEX IF NOT EXISTS idx_sms_messages_template_id ON public.sms_messages(template_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON public.sms_templates(is_active) WHERE is_active = true;

-- Create RLS policies (adjust as needed for your security requirements)
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write SMS messages
CREATE POLICY "Users can manage SMS messages" ON public.sms_messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to read/write SMS templates  
CREATE POLICY "Users can manage SMS templates" ON public.sms_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to get SMS metrics (optional)
CREATE OR REPLACE FUNCTION get_sms_metrics()
RETURNS TABLE (
    total_messages bigint,
    sent_messages bigint,
    delivered_messages bigint,
    failed_messages bigint,
    pending_messages bigint,
    delivery_rate numeric,
    total_cost numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_messages,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_messages,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_messages,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_messages,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::numeric / COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::numeric) * 100, 2)
            ELSE 0 
        END as delivery_rate,
        COALESCE(SUM(cost), 0) as total_cost
    FROM public.sms_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sms_messages', 'sms_templates')
ORDER BY table_name; 