-- Fix automation triggers to include required message_id field

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_auto_welcome_email_simple ON members;
DROP TRIGGER IF EXISTS trigger_lifecycle_welcome_email_simple ON contacts;

-- Create updated function that includes message_id
CREATE OR REPLACE FUNCTION auto_send_welcome_email_simple()
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
                
                -- Check what columns exist in email_queue and insert accordingly
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'email_queue' AND column_name = 'metadata'
                ) THEN
                    -- Use full structure if metadata column exists
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
                ELSE
                    -- Use minimal structure for older email_queue table
                    INSERT INTO email_queue (
                        message_id,
                        to_address,
                        status,
                        created_at
                    ) VALUES (
                        gen_random_uuid(),
                        contact_record.email,
                        'pending',
                        NOW()
                    );
                    
                    -- Log that we need to update email_queue structure
                    RAISE NOTICE 'Welcome email queued for % but email_queue table needs updating for full functionality', contact_record.email;
                END IF;
                
                RAISE NOTICE 'Auto-enqueued welcome email for new member: %', contact_record.email;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the member creation
    RAISE WARNING 'Error in welcome email automation: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create updated lifecycle trigger
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
                
                -- Check what columns exist in email_queue and insert accordingly
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'email_queue' AND column_name = 'metadata'
                ) THEN
                    -- Use full structure if metadata column exists
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
                ELSE
                    -- Use minimal structure for older email_queue table
                    INSERT INTO email_queue (
                        message_id,
                        to_address,
                        status,
                        created_at
                    ) VALUES (
                        gen_random_uuid(),
                        NEW.email,
                        'pending',
                        NOW()
                    );
                    
                    -- Log that we need to update email_queue structure
                    RAISE NOTICE 'Welcome email queued for % but email_queue table needs updating for full functionality', NEW.email;
                END IF;
                
                RAISE NOTICE 'Auto-enqueued welcome email for lifecycle change: %', NEW.email;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the contact update
    RAISE WARNING 'Error in lifecycle welcome email automation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new triggers with error handling
CREATE TRIGGER trigger_auto_welcome_email_simple
    AFTER INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION auto_send_welcome_email_simple();

CREATE TRIGGER trigger_lifecycle_welcome_email_simple
    AFTER UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION auto_send_lifecycle_welcome_email_simple();

COMMENT ON FUNCTION auto_send_welcome_email_simple() IS 'Fixed welcome email automation with message_id and error handling';
COMMENT ON FUNCTION auto_send_lifecycle_welcome_email_simple() IS 'Fixed lifecycle welcome email automation with message_id and error handling'; 