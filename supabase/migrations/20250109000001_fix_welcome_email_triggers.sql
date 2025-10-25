-- Fix welcome email triggers for member conversions
-- This ensures welcome emails are sent when:
-- 1. A visitor is converted to a member (lifecycle change)
-- 2. A soul winning contact is converted to a member (lifecycle change)
-- 3. A new member is added directly

-- Drop existing triggers to start fresh
DROP TRIGGER IF EXISTS trigger_lifecycle_welcome_email_simple ON contacts;
DROP TRIGGER IF EXISTS trigger_auto_welcome_email_for_new_member ON members;
DROP TRIGGER IF EXISTS trigger_auto_welcome_email_simple ON members;

-- Create function to handle lifecycle changes to member
CREATE OR REPLACE FUNCTION auto_send_lifecycle_welcome_email_simple()
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
                
                -- Enqueue email
                INSERT INTO email_queue (
                    message_id,
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
                    gen_random_uuid(),
                    NEW.email,
                    'info@docmchurch.org',
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
            ELSE
                RAISE NOTICE 'No welcome template found for lifecycle change: %', NEW.email;
            END IF;
        ELSE
            RAISE NOTICE 'No email address for contact: %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the lifecycle change
    RAISE WARNING 'Error in welcome email automation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new member creation
CREATE OR REPLACE FUNCTION auto_send_welcome_email_for_new_member()
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
                
                -- Enqueue email
                INSERT INTO email_queue (
                    message_id,
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
                    gen_random_uuid(),
                    contact_record.email,
                    'info@docmchurch.org',
                    processed_subject,
                    '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' || REPLACE(processed_body, E'\n', '<br>') || '</div>',
                    processed_body,
                    json_build_object(
                        'template_type', 'welcome_member',
                        'contact_id', contact_record.id,
                        'sent_via', 'new_member_trigger',
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
            ELSE
                RAISE NOTICE 'No welcome template found for new member: %', contact_record.email;
            END IF;
        ELSE
            RAISE NOTICE 'Contact not found or no email for contact_id: %', NEW.contact_id;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the member creation
    RAISE WARNING 'Error in welcome email automation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_lifecycle_welcome_email_simple
    AFTER UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION auto_send_lifecycle_welcome_email_simple();

CREATE TRIGGER trigger_auto_welcome_email_for_new_member
    AFTER INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION auto_send_welcome_email_for_new_member();

-- Add a comment to track this fix
COMMENT ON TRIGGER trigger_lifecycle_welcome_email_simple ON contacts IS 'Sends welcome email when contact lifecycle changes to member (visitor/soul winning conversions)';
COMMENT ON TRIGGER trigger_auto_welcome_email_for_new_member ON members IS 'Sends welcome email when new member is added directly'; 