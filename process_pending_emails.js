const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processPendingEmails() {
  console.log('🚀 Processing pending emails...\n');
  
  try {
    // 1. Get pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Error fetching pending emails:', fetchError);
      return;
    }
    
    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('✅ No pending emails to process');
      return;
    }
    
    console.log(`📧 Found ${pendingEmails.length} pending emails to process\n`);
    
    // 2. Process each email using the existing API endpoint
    for (const email of pendingEmails) {
      console.log(`Processing email ${email.id} to ${email.to_address}...`);
      console.log(`  Subject: ${email.subject || 'No subject'}`);
      console.log(`  Has HTML body: ${!!email.html_body}`);
      console.log(`  Has text body: ${!!email.text_body}`);
      
      try {
        // Use the existing email sending API with correct field names
        const response = await fetch('http://localhost:3003/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email.to_address,
            subject: email.subject || 'Welcome!',
            html: email.html_body || email.text_body || 'Welcome to our church family!',
            text: email.text_body,
            emailType: email.metadata?.email_type || 'system'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Email sent successfully: ${result.messageId || 'OK'}`);
          
          // Mark as sent in the queue
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);
          
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to send email: ${response.status} ${errorText}`);
          
          // Mark as failed
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: `HTTP ${response.status}: ${errorText}`,
              attempts: (email.attempts || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);
        }
        
      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error.message);
        
        // Mark as failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            attempts: (email.attempts || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);
      }
      
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Email processing complete!');
    
    // 3. Show final status
    const { data: finalStatus } = await supabase
      .from('email_queue')
      .select('status')
      .in('status', ['pending', 'sent', 'failed']);
    
    const statusCounts = finalStatus?.reduce((acc, email) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Final email queue status:');
    console.log(`   Pending: ${statusCounts?.pending || 0}`);
    console.log(`   Sent: ${statusCounts?.sent || 0}`);
    console.log(`   Failed: ${statusCounts?.failed || 0}`);
    
  } catch (error) {
    console.error('❌ Error in processPendingEmails:', error);
  }
}

// Run the processing
processPendingEmails(); 