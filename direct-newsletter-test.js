require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

async function testDirectInsert() {
  console.log('🔍 Testing direct newsletter insert...');
  const testEmail = 'direct-test-' + Date.now() + '@test.com';
  
  console.log('📧 Attempting to insert:', testEmail);
  
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert([{
      email: testEmail,
      first_name: 'Direct',
      last_name: 'Test',
      subscribed_at: new Date().toISOString(),
      status: 'active',
      subscription_source: 'contact_form'
    }])
    .select();
    
  if (error) {
    console.error('❌ Direct insert failed:', error);
  } else {
    console.log('✅ Direct insert succeeded:', data);
    
    // Clean up
    await supabase.from('newsletter_subscribers').delete().eq('email', testEmail);
    console.log('🧹 Test record cleaned up');
  }
}

testDirectInsert(); 