/**
 * Test script to verify automatic welcome workflow triggers
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

async function testAutomaticTriggers() {
  console.log('🧪 Testing Automatic Welcome Workflow Triggers\n');

  try {
    const timestamp = Date.now();
    
    // Create test contact
    console.log('1. Creating test contact...');
    const testContactData = {
      first_name: 'Test',
      last_name: `User-${timestamp}`,
      email: `test-trigger-${timestamp}@example.com`,
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

    console.log(`✅ Test contact created: ${contactData.first_name} ${contactData.last_name} (${contactData.id})`);

    // Create member from contact
    console.log('\n2. Creating member from contact...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const memberData = {
      contact_id: contactData.id,
      joined_at: new Date().toISOString().split('T')[0],
      notes: 'Test member for automatic trigger testing'
    };

    const { data: memberResult, error: memberError } = await supabase
      .from('members')
      .insert(memberData)
      .select();

    if (memberError) {
      throw new Error(`Failed to create member: ${memberError.message}`);
    }

    console.log(`✅ Member created successfully`);

    // Check if workflow was triggered
    console.log('\n3. Checking if welcome email was queued...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: emailQueue, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_email', contactData.email)
      .order('created_at', { ascending: false })
      .limit(5);

    if (queueError) {
      console.warn('⚠️ Could not check email queue:', queueError.message);
    } else {
      console.log(`📧 Email queue entries for ${contactData.email}:`, emailQueue?.length || 0);
      
      const recentWelcomeEmails = emailQueue?.filter(email => 
        email.created_at > new Date(Date.now() - 5 * 60 * 1000).toISOString() &&
        email.subject?.toLowerCase().includes('welcome')
      ) || [];

      if (recentWelcomeEmails.length > 0) {
        console.log('🎉 SUCCESS: Welcome email was automatically queued!');
        recentWelcomeEmails.forEach((email, index) => {
          console.log(`   ${index + 1}. Subject: "${email.subject}" (${email.status})`);
        });
      } else {
        console.log('❌ ISSUE: No welcome email found in queue');
        if (emailQueue?.length > 0) {
          console.log('📋 All emails for this contact:');
          emailQueue.forEach((email, index) => {
            console.log(`   ${index + 1}. Subject: "${email.subject}" (${email.status})`);
          });
        }
      }
    }

    // Test direct workflow trigger
    console.log('\n4. Testing direct workflow trigger...');
    
    try {
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

      const workflowResult = await workflowResponse.json();
      
      if (workflowResponse.ok && workflowResult.success) {
        console.log('✅ Direct workflow trigger successful');
      } else {
        console.log('❌ Direct workflow trigger failed:', workflowResult);
      }
    } catch (workflowError) {
      console.log('❌ Direct workflow trigger error:', workflowError.message);
    }

    // Check email queue again
    console.log('\n5. Checking email queue after direct trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: emailQueue2 } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_email', contactData.email)
      .order('created_at', { ascending: false })
      .limit(5);

    const totalWelcomeEmails = emailQueue2?.filter(email => 
      email.subject?.toLowerCase().includes('welcome')
    ) || [];

    console.log(`📧 Total welcome emails queued: ${totalWelcomeEmails.length}`);

    // Clean up
    console.log('\n6. Cleaning up test data...');
    await supabase.from('members').delete().eq('contact_id', contactData.id);
    await supabase.from('contacts').delete().eq('id', contactData.id);
    console.log('🗑️ Test data cleaned up');

    console.log('\n🏁 Test completed!');
    
    if (totalWelcomeEmails.length > 0) {
      console.log('✅ RESULT: Automatic workflow triggers are working!');
    } else {
      console.log('❌ RESULT: Automatic workflow triggers need to be fixed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAutomaticTriggers().catch(console.error); 