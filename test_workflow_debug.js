/**
 * Debug test for workflow function
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ufjfafcfkalaasdhgcbi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function debugWorkflow() {
  console.log('🔍 Debugging Workflow Function\n');

  try {
    const timestamp = Date.now();
    
    // Create test contact
    console.log('1. Creating test contact...');
    const testContactData = {
      first_name: 'Debug',
      last_name: `Test-${timestamp}`,
      email: `debug-${timestamp}@example.com`,
      phone: `+123456${timestamp.toString().slice(-4)}`,
      lifecycle: 'contact',
      tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    };

    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .insert(testContactData)
      .select()
      .single();

    if (contactError) {
      throw new Error(`Failed to create test contact: ${contactError.message}`);
    }

    console.log(`✅ Contact created: ${contactData.email} (${contactData.id})`);

    // Check if welcome template exists
    console.log('\n2. Checking welcome template...');
    const { data: template, error: templateError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'welcome_member')
      .eq('channel', 'email')
      .single();

    if (templateError || !template) {
      console.error('❌ Welcome template not found:', templateError);
      return;
    } else {
      console.log('✅ Welcome template found:', template.subject);
    }

    // Check church settings
    console.log('\n3. Checking church settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.error('❌ Church settings not found:', settingsError);
      return;
    } else {
      console.log('✅ Church settings found:', settings.name);
    }

    // Test workflow trigger with detailed response
    console.log('\n4. Triggering workflow with debug info...');
    
    const workflowResponse = await fetch(
      'https://ufjfafcfkalaasdhgcbi.supabase.co/functions/v1/execute-workflows',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ3MTMsImV4cCI6MjA2MzI5MDcxM30.PzwQAeRUJDK8llZf0awLwgW6j-pAmZPOgz55USsOnyo`,
        },
        body: JSON.stringify({
          trigger: {
            type: 'new_member',
            contactId: contactData.id
          }
        }),
      }
    );

    console.log('📊 Workflow response status:', workflowResponse.status);
    console.log('📊 Workflow response headers:', Object.fromEntries(workflowResponse.headers.entries()));

    const workflowResult = await workflowResponse.json();
    console.log('📊 Workflow response body:', JSON.stringify(workflowResult, null, 2));

    if (!workflowResponse.ok) {
      console.error('❌ Workflow failed:', workflowResult);
      return;
    }

    // Check email queue immediately after workflow
    console.log('\n5. Checking email queue (immediate)...');
    const { data: emailsImmediate, error: queueError1 } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_address', contactData.email)
      .order('created_at', { ascending: false });

    console.log(`📧 Immediate emails: ${emailsImmediate?.length || 0}`);
    if (emailsImmediate?.length > 0) {
      emailsImmediate.forEach((email, index) => {
        console.log(`   ${index + 1}. Subject: "${email.subject}" (${email.status})`);
        console.log(`      Metadata: ${JSON.stringify(email.metadata)}`);
      });
    }

    // Wait and check again
    console.log('\n6. Waiting 5 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const { data: emailsDelayed, error: queueError2 } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_address', contactData.email)
      .order('created_at', { ascending: false });

    console.log(`📧 Delayed emails: ${emailsDelayed?.length || 0}`);
    if (emailsDelayed?.length > 0) {
      emailsDelayed.forEach((email, index) => {
        console.log(`   ${index + 1}. Subject: "${email.subject}" (${email.status})`);
        console.log(`      Created: ${email.created_at}`);
      });
    }

    // Test direct email queue insertion to verify table access
    console.log('\n7. Testing direct email queue insertion...');
    try {
      const messageId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { data: directInsert, error: insertError } = await supabase
        .from('email_queue')
        .insert({
          message_id: messageId,
          to_address: contactData.email,
          from_address: 'test@docmchurch.org',
          subject: 'Direct Insert Test',
          html_body: '<p>This is a test email</p>',
          text_body: 'This is a test email',
          status: 'pending',
          metadata: { test: true },
          max_attempts: 3,
          attempts: 0
        })
        .select();

      if (insertError) {
        console.error('❌ Direct insert failed:', insertError);
      } else {
        console.log('✅ Direct insert succeeded');
        
        // Clean up test email
        await supabase.from('email_queue').delete().eq('id', directInsert[0].id);
      }
    } catch (directError) {
      console.error('❌ Direct insert error:', directError);
    }

    // Clean up
    console.log('\n8. Cleaning up...');
    await supabase.from('contacts').delete().eq('id', contactData.id);
    console.log('🗑️ Test data cleaned up');

    console.log('\n🏁 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debugWorkflow().catch(console.error); 