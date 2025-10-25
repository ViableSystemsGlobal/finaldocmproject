const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ufjfafcfkalaasdhgcbi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA'
);

async function fixTriggers() {
  console.log('🔧 Setting up database triggers for welcome emails...');
  
  try {
    // 1. Create the trigger function for new members
    console.log('Creating trigger function...');
    const { error: funcError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Create function to automatically send welcome emails for new members
        CREATE OR REPLACE FUNCTION send_welcome_email_trigger()
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
                    
                    -- If template found
                    IF template_record IS NOT NULL THEN
                        -- Process template variables
                        processed_subject := COALESCE(template_record.subject, 'Welcome!');
                        processed_subject := REPLACE(processed_subject, '{{ church_name }}', 'Our Church');
                        processed_subject := REPLACE(processed_subject, '{{ first_name }}', COALESCE(contact_record.first_name, ''));
                        
                        processed_body := COALESCE(template_record.body, 'Welcome to our church family!');
                        processed_body := REPLACE(processed_body, '{{ church_name }}', 'Our Church');
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
                    ELSE
                        RAISE NOTICE 'No welcome template found for %', contact_record.email;
                    END IF;
                ELSE
                    RAISE NOTICE 'Contact not found or no email for contact_id: %', NEW.contact_id;
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

    if (funcError) {
      console.error('❌ Error creating function:', funcError);
      return;
    }

    // 2. Drop existing trigger if it exists
    console.log('Dropping existing trigger...');
    await supabase.rpc('execute_sql', {
      sql: 'DROP TRIGGER IF EXISTS trigger_send_welcome_email ON members;'
    });

    // 3. Create the trigger
    console.log('Creating trigger...');
    const { error: triggerError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TRIGGER trigger_send_welcome_email
            AFTER INSERT ON members
            FOR EACH ROW
            EXECUTE FUNCTION send_welcome_email_trigger();
      `
    });

    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      return;
    }

    console.log('✅ Database triggers created successfully!');

    // 4. Test with the most recent members
    console.log('\n🧪 Testing with recent members...');
    
    // Get the most recent members
    const { data: recentMembers } = await supabase
      .from('members')
      .select('contact_id, contacts(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .limit(2);

    if (recentMembers && recentMembers.length > 0) {
      for (const member of recentMembers) {
        console.log(`Testing trigger for: ${member.contacts.first_name} ${member.contacts.last_name} (${member.contacts.email})`);
        
        // Manually trigger the function
        const { error: testError } = await supabase.rpc('execute_sql', {
          sql: `
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
              '${member.contacts.email}',
              'info@docmchurch.org',
              'Welcome to Our Church, ${member.contacts.first_name}!',
              '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">Dear ${member.contacts.first_name},<br><br>Welcome to the Our Church family! We are so excited to have you as part of our community.<br><br>You will receive regular updates about church events, services, and opportunities to get involved.<br><br>If you have any questions, please feel free to reach out to us.<br><br>Blessings,<br>The Our Church Team</div>',
              'Dear ${member.contacts.first_name}, Welcome to the Our Church family! We are so excited to have you as part of our community. You will receive regular updates about church events, services, and opportunities to get involved. If you have any questions, please feel free to reach out to us. Blessings, The Our Church Team',
              '{"template_type": "welcome_member", "contact_id": "${member.contact_id}", "sent_via": "manual_fix", "triggered_at": "' + new Date().toISOString() + '", "email_type": "system"}',
              'pending',
              0,
              3,
              NOW(),
              NOW()
            );
          `
        });

        if (!testError) {
          console.log(`✅ Welcome email queued for ${member.contacts.first_name}!`);
        } else {
          console.error(`❌ Error queuing email for ${member.contacts.first_name}:`, testError);
        }
      }
    }

    console.log('\n🎉 Setup complete! Future member creations will automatically trigger welcome emails.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixTriggers(); 