const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const timestamp = Date.now();
  const testMember = {
    first_name: 'Direct',
    last_name: 'Email-Test',
    email: `directemail.test.${timestamp}@example.com`,
    phone: `+123456${timestamp.toString().slice(-4)}`,
    lifecycle: 'member',
    tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  };
  
  console.log('🧪 Creating member:', testMember.email);
  const { data: memberData, error } = await supabase.from('contacts').insert(testMember).select().single();
  if (error) { 
    console.error('❌ Error:', error); 
    return; 
  }
  
  console.log('✅ Member created:', memberData.id);
  console.log('🚀 Triggering workflow...');
  
  const { data: result, error: workflowError } = await supabase.functions.invoke('execute-workflows', {
    body: { type: 'new_member', contactId: memberData.id }
  });
  
  if (workflowError) {
    console.error('❌ Workflow error:', workflowError);
  } else {
    console.log('✅ Workflow result:', result);
  }
  
  // Wait a bit for email processing
  console.log('⏳ Waiting 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Cleanup
  await supabase.from('contacts').delete().eq('id', memberData.id);
  console.log('🧹 Cleaned up');
}

test().catch(console.error); 