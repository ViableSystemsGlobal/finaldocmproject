-- Create function to trigger new member workflow
CREATE OR REPLACE FUNCTION trigger_new_member_workflow()
RETURNS TRIGGER AS $$
DECLARE
    contact_record RECORD;
BEGIN
    -- Only process if this is a new member record
    IF TG_OP = 'INSERT' THEN
        -- Get the contact details
        SELECT id, first_name, last_name, email, lifecycle
        INTO contact_record
        FROM contacts 
        WHERE id = NEW.contact_id 
        AND email IS NOT NULL 
        AND email != '';
        
        -- If contact found and has email, trigger welcome workflow
        IF FOUND AND contact_record.email IS NOT NULL THEN
            -- Use pg_notify to trigger the workflow
            PERFORM pg_notify('new_member_workflow', json_build_object(
                'contact_id', contact_record.id,
                'email', contact_record.email,
                'first_name', contact_record.first_name,
                'last_name', contact_record.last_name
            )::text);
            
            RAISE NOTICE 'Triggered new member workflow for %', contact_record.email;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on members table
DROP TRIGGER IF EXISTS trigger_new_member_workflow_automation ON members;
CREATE TRIGGER trigger_new_member_workflow_automation
    AFTER INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_new_member_workflow();

-- Create function to trigger new member workflow when contact lifecycle changes
CREATE OR REPLACE FUNCTION trigger_lifecycle_member_workflow()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if lifecycle changed to 'member'
    IF TG_OP = 'UPDATE' AND OLD.lifecycle != 'member' AND NEW.lifecycle = 'member' THEN
        -- Check if contact has email
        IF NEW.email IS NOT NULL AND NEW.email != '' THEN
            -- Use pg_notify to trigger the workflow
            PERFORM pg_notify('new_member_workflow', json_build_object(
                'contact_id', NEW.id,
                'email', NEW.email,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name
            )::text);
            
            RAISE NOTICE 'Triggered new member workflow for lifecycle change: %', NEW.email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contacts table for lifecycle changes
DROP TRIGGER IF EXISTS trigger_lifecycle_member_workflow_automation ON contacts;
CREATE TRIGGER trigger_lifecycle_member_workflow_automation
    AFTER UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_lifecycle_member_workflow();

-- Create function to automatically enqueue welcome emails for new members
CREATE OR REPLACE FUNCTION auto_send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    contact_record RECORD;
    template_record RECORD;
    church_settings RECORD;
    processed_subject TEXT;
    processed_body TEXT;
BEGIN
    -- Only process if this is a new member record
    IF TG_OP = 'INSERT' THEN
        -- Get the contact details
        SELECT id, first_name, last_name, email, lifecycle
        INTO contact_record
        FROM contacts 
        WHERE id = NEW.contact_id 
        AND email IS NOT NULL 
        AND email != '';
        
        -- If contact found and has email
        IF FOUND AND contact_record.email IS NOT NULL THEN
            -- Get welcome template
            SELECT subject, body
            INTO template_record
            FROM comms_defaults
            WHERE template_name = 'welcome_member'
            AND channel = 'email'
            AND is_active = true;
            
            -- Get church settings
            SELECT church_name
            INTO church_settings
            FROM tenant_settings
            LIMIT 1;
            
            -- If template found
            IF template_record IS NOT NULL THEN
                -- Process template variables
                processed_subject := COALESCE(template_record.subject, 'Welcome!');
                processed_subject := REPLACE(processed_subject, '{{ church_name }}', COALESCE(church_settings.church_name, 'Our Church'));
                processed_subject := REPLACE(processed_subject, '{{ first_name }}', COALESCE(contact_record.first_name, ''));
                
                processed_body := COALESCE(template_record.body, 'Welcome to our church family!');
                processed_body := REPLACE(processed_body, '{{ church_name }}', COALESCE(church_settings.church_name, 'Our Church'));
                processed_body := REPLACE(processed_body, '{{ first_name }}', COALESCE(contact_record.first_name, ''));
                processed_body := REPLACE(processed_body, '{{ last_name }}', COALESCE(contact_record.last_name, ''));
                
                -- Enqueue email using existing email_queue system with proper structure
                INSERT INTO email_queue (
                    to_address,
                    from_address,
                    subject,
                    html_body,
                    text_body,
                    metadata,
                    status,
                    attempts,
                    max_attempts,
                    next_attempt_at,
                    created_at
                ) VALUES (
                    contact_record.email,
                    'info@docmchurch.org', -- Use your info account for welcome emails
                    processed_subject,
                    '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' || REPLACE(processed_body, E'\n', '<br>') || '</div>',
                    processed_body,
                    json_build_object(
                        'template_type', 'welcome_member',
                        'contact_id', contact_record.id,
                        'sent_via', 'auto_trigger',
                        'triggered_at', NOW(),
                        'email_type', 'system'
                    ),
                    'pending',
                    0,
                    3,
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Auto-enqueued welcome email for new member: %', contact_record.email;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new members
DROP TRIGGER IF EXISTS trigger_auto_welcome_email ON members;
CREATE TRIGGER trigger_auto_welcome_email
    AFTER INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION auto_send_welcome_email();

-- Create function to handle lifecycle changes to member
CREATE OR REPLACE FUNCTION auto_send_lifecycle_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    template_record RECORD;
    church_settings RECORD;
    processed_subject TEXT;
    processed_body TEXT;
BEGIN
    -- Only process if lifecycle changed to 'member'
    IF TG_OP = 'UPDATE' AND OLD.lifecycle != 'member' AND NEW.lifecycle = 'member' THEN
        -- Check if contact has email
        IF NEW.email IS NOT NULL AND NEW.email != '' THEN
            -- Get welcome template
            SELECT subject, body
            INTO template_record
            FROM comms_defaults
            WHERE template_name = 'welcome_member'
            AND channel = 'email'
            AND is_active = true;
            
            -- Get church settings
            SELECT church_name
            INTO church_settings
            FROM tenant_settings
            LIMIT 1;
            
            -- If template found
            IF template_record IS NOT NULL THEN
                -- Process template variables
                processed_subject := COALESCE(template_record.subject, 'Welcome!');
                processed_subject := REPLACE(processed_subject, '{{ church_name }}', COALESCE(church_settings.church_name, 'Our Church'));
                processed_subject := REPLACE(processed_subject, '{{ first_name }}', COALESCE(NEW.first_name, ''));
                
                processed_body := COALESCE(template_record.body, 'Welcome to our church family!');
                processed_body := REPLACE(processed_body, '{{ church_name }}', COALESCE(church_settings.church_name, 'Our Church'));
                processed_body := REPLACE(processed_body, '{{ first_name }}', COALESCE(NEW.first_name, ''));
                processed_body := REPLACE(processed_body, '{{ last_name }}', COALESCE(NEW.last_name, ''));
                
                -- Enqueue email using existing email_queue system
                INSERT INTO email_queue (
                    to_address,
                    from_address,
                    subject,
                    html_body,
                    text_body,
                    metadata,
                    status,
                    attempts,
                    max_attempts,
                    next_attempt_at,
                    created_at
                ) VALUES (
                    NEW.email,
                    'info@docmchurch.org', -- Use your info account for welcome emails
                    processed_subject,
                    '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' || REPLACE(processed_body, E'\n', '<br>') || '</div>',
                    processed_body,
                    json_build_object(
                        'template_type', 'welcome_member',
                        'contact_id', NEW.id,
                        'sent_via', 'lifecycle_trigger',
                        'triggered_at', NOW(),
                        'email_type', 'system'
                    ),
                    'pending',
                    0,
                    3,
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Auto-enqueued welcome email for lifecycle change: %', NEW.email;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contacts table for lifecycle changes
DROP TRIGGER IF EXISTS trigger_lifecycle_welcome_email ON contacts;
CREATE TRIGGER trigger_lifecycle_welcome_email
    AFTER UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION auto_send_lifecycle_welcome_email();

-- Create settings table for workflow automation
CREATE TABLE IF NOT EXISTS workflow_automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN DEFAULT true,
    welcome_email_enabled BOOLEAN DEFAULT true,
    birthday_reminder_enabled BOOLEAN DEFAULT true,
    visitor_followup_enabled BOOLEAN DEFAULT true,
    event_reminder_enabled BOOLEAN DEFAULT true,
    welcome_email_delay_hours INTEGER DEFAULT 1,
    visitor_followup_delay_days INTEGER DEFAULT 3,
    event_reminder_hours_before INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO workflow_automation_settings (
    enabled, 
    welcome_email_enabled, 
    birthday_reminder_enabled, 
    visitor_followup_enabled, 
    event_reminder_enabled
) VALUES (
    true, true, true, true, true
) ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for automation settings table
ALTER TABLE workflow_automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on workflow_automation_settings" ON workflow_automation_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON workflow_automation_settings TO anon, authenticated, service_role;

-- Create function to check if a specific workflow type is enabled
CREATE OR REPLACE FUNCTION is_workflow_enabled(workflow_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    settings_record RECORD;
    result BOOLEAN := false;
BEGIN
    SELECT * INTO settings_record FROM workflow_automation_settings LIMIT 1;
    
    IF settings_record IS NOT NULL AND settings_record.enabled THEN
        CASE workflow_type
            WHEN 'welcome_email' THEN
                result := settings_record.welcome_email_enabled;
            WHEN 'birthday_reminder' THEN
                result := settings_record.birthday_reminder_enabled;
            WHEN 'visitor_followup' THEN
                result := settings_record.visitor_followup_enabled;
            WHEN 'event_reminder' THEN
                result := settings_record.event_reminder_enabled;
            ELSE
                result := false;
        END CASE;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger for automation settings
CREATE TRIGGER update_workflow_automation_settings_updated_at
    BEFORE UPDATE ON workflow_automation_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_metadata_gin ON email_queue USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_email ON contacts(lifecycle) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_date_of_birth_not_null ON contacts(date_of_birth) WHERE date_of_birth IS NOT NULL;

COMMENT ON TABLE workflow_automation_settings IS 'Settings for controlling automated workflow execution';
COMMENT ON FUNCTION trigger_new_member_workflow() IS 'Triggers new member welcome workflow via pg_notify';
COMMENT ON FUNCTION auto_send_welcome_email() IS 'Automatically sends welcome emails for new members using existing email queue system';
COMMENT ON FUNCTION auto_send_lifecycle_welcome_email() IS 'Automatically sends welcome emails when contact becomes member using existing email queue system';
COMMENT ON FUNCTION is_workflow_enabled(TEXT) IS 'Checks if a specific workflow type is enabled in settings'; 