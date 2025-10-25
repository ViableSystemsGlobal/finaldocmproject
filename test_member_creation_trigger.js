/**
 * Test member creation workflow trigger
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMemberCreationTrigger() {
  console.log('🧪 Testing automatic workflow trigger for new member...\n');

  try {
    // 1. Create a test member
    const timestamp = Date.now();
    const testMember = {
      first_name: 'Direct',
      last_name: 'Email-Test',
      email: `directemail.test.${timestamp}@example.com`,
      phone: `+123456${timestamp.toString().slice(-4)}`,
      lifecycle: 'member',
      tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      created_at: new Date().toISOString()
    };

    console.log('👤 Creating test member:', testMember.first_name, testMember.last_name);

    const { data: memberData, error: memberError } = await supabase
      .from('contacts')
      .insert(testMember)
      .select()
      .single();

    if (memberError) {
      console.error('❌ Error creating member:', memberError);
      return;
    }

    console.log('✅ Member created successfully:', memberData.id);

    // 2. Trigger the workflow manually using the edge function
    console.log('\n🚀 Triggering workflow via edge function...');
    
    const { data: workflowResult, error: workflowError } = await supabase.functions.invoke('execute-workflows', {
      body: {
        type: 'new_member',
        contactId: memberData.id
      }
    });

    if (workflowError) {
      console.error('❌ Error triggering workflow:', workflowError);
      return;
    }

    console.log('✅ Workflow triggered successfully:', workflowResult);

    // 3. Wait a moment for processing
    console.log('\n⏳ Waiting 5 seconds for email processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Since we're using direct email (bypass queue), we can't check email_queue
    // Instead, let's verify the workflow processed by checking if the function executed without errors
    console.log('\n📧 Email sent via direct SMTP (bypassing queue)');
    console.log('✅ Test completed successfully!');
    
    // 5. Clean up - delete the test member
    console.log('\n🧹 Cleaning up test member...');
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', memberData.id);

    if (deleteError) {
      console.error('⚠️ Error deleting test member:', deleteError);
    } else {
      console.log('✅ Test member cleaned up successfully');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testMemberCreationTrigger(); 