const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyTriggerFix() {
  console.log('🔧 Applying trigger fix...\n');
  
  try {
    // Drop existing triggers
    console.log('1. Dropping existing triggers...');
    await supabase.rpc('execute_sql', {
      sql: `
        DROP TRIGGER IF EXISTS trigger_auto_welcome_email_simple ON members;
        DROP TRIGGER IF EXISTS trigger_lifecycle_welcome_email_simple ON contacts;
      `
    });
    console.log('✅ Dropped existing triggers');
    
    // Create updated function with message_id
    console.log('\n2. Creating updated trigger function...');
    await supabase.rpc('execute_sql', {
      sql: `
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
                        
                        -- Insert with message_id
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
                            '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' || REPLACE(processed_body, E'\\n', '<br>') || '</div>',
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
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the member creation
            RAISE WARNING 'Error in welcome email automation: %', SQLERRM;
            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ Created updated trigger function');
    
    // Create the trigger
    console.log('\n3. Creating trigger...');
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE TRIGGER trigger_auto_welcome_email_simple
            AFTER INSERT ON members
            FOR EACH ROW
            EXECUTE FUNCTION auto_send_welcome_email_simple();
      `
    });
    console.log('✅ Created trigger');
    
    console.log('\n✅ Trigger fix applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying trigger fix:', error);
  }
}

// Run the fix
applyTriggerFix(); 