require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkEmailQueue() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📧 Checking email queue...');
    
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`\n📬 Found ${data?.length || 0} recent emails in queue:`);
    
    if (data && data.length > 0) {
      data.forEach((email, index) => {
        console.log(`${index + 1}. To: ${email.to_address}`);
        console.log(`   Status: ${email.status}`);
        console.log(`   Subject: ${email.subject || 'No subject'}`);
        console.log(`   Created: ${email.created_at}`);
        console.log(`   Attempts: ${email.attempts || 0}`);
        
        if (email.metadata) {
          const meta = typeof email.metadata === 'string' 
            ? JSON.parse(email.metadata) 
            : email.metadata;
          console.log(`   Type: ${meta.template_type || meta.email_type || 'Unknown'}`);
        }
        console.log('');
      });
      
      // Check status distribution
      const statusCounts = data.reduce((acc, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Status distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      // Check for recent automated emails
      const automatedEmails = data.filter(email => {
        if (!email.metadata) return false;
        const meta = typeof email.metadata === 'string' 
          ? JSON.parse(email.metadata) 
          : email.metadata;
        return meta.template_type || meta.sent_via;
      });
      
      console.log(`\n🤖 Automated emails: ${automatedEmails.length}`);
      
      if (automatedEmails.length > 0) {
        console.log('✅ NOTIFICATION SENDING IS WORKING! ✅');
      } else {
        console.log('⚠️ No recent automated emails found');
      }
      
    } else {
      console.log('📭 No emails found in queue');
      console.log('💡 Try creating a new member or triggering a workflow to test');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkEmailQueue(); 