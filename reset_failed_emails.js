const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetFailedEmails() {
  console.log('🔄 Resetting failed emails to pending...\n');
  
  try {
    // Reset failed emails to pending
    const { data, error } = await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        attempts: 0,
        error_message: null,
        next_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('status', 'failed')
      .select();
    
    if (error) {
      console.error('❌ Error resetting emails:', error);
      return;
    }
    
    console.log(`✅ Reset ${data?.length || 0} emails from failed to pending`);
    
    // Show current status
    const { data: statusData } = await supabase
      .from('email_queue')
      .select('status')
      .in('status', ['pending', 'sent', 'failed']);
    
    const statusCounts = statusData?.reduce((acc, email) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Current email queue status:');
    console.log(`   Pending: ${statusCounts?.pending || 0}`);
    console.log(`   Sent: ${statusCounts?.sent || 0}`);
    console.log(`   Failed: ${statusCounts?.failed || 0}`);
    
  } catch (error) {
    console.error('❌ Error in resetFailedEmails:', error);
  }
}

// Run the reset
resetFailedEmails(); 