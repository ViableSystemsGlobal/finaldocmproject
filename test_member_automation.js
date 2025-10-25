const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMemberAutomation() {
  console.log('🧪 Testing member automation...\n');
  
  try {
    // 1. Get tenant_id first
    const { data: tenantData } = await supabase
      .from('tenant_settings')
      .select('id')
      .limit(1)
      .single();
    
    const tenantId = tenantData?.id;
    if (!tenantId) {
      console.error('❌ No tenant found');
      return;
    }
    
    // Create a test contact
    const testContact = {
      first_name: 'Test',
      last_name: 'Automation',
      email: 'test.automation@example.com',
      lifecycle: 'contact',
      tenant_id: tenantId
    };
    
    console.log('1. Creating test contact...');
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert(testContact)
      .select()
      .single();
    
    if (contactError) {
      console.error('❌ Error creating contact:', contactError);
      return;
    }
    
    console.log(`✅ Created contact: ${contact.first_name} ${contact.last_name} (${contact.id})`);
    
    // 2. Wait a moment for any triggers to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Check if any emails were queued for this contact
    console.log('\n2. Checking for queued emails...');
    const { data: queuedEmails, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_address', testContact.email)
      .order('created_at', { ascending: false });
    
    if (queueError) {
      console.error('❌ Error checking email queue:', queueError);
    } else {
      console.log(`Found ${queuedEmails?.length || 0} emails for this contact`);
    }
    
    // 4. Now convert the contact to a member (this should trigger the welcome email)
    console.log('\n3. Converting contact to member...');
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        contact_id: contact.id,
        joined_at: new Date().toISOString(),
        notes: 'Test automation member'
      })
      .select()
      .single();
    
    if (memberError) {
      console.error('❌ Error creating member:', memberError);
      return;
    }
    
    console.log(`✅ Created member for contact ${contact.id}`);
    
    // 5. Wait for triggers to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Check for new emails
    console.log('\n4. Checking for new welcome emails...');
    const { data: newEmails, error: newEmailError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_address', testContact.email)
      .order('created_at', { ascending: false });
    
    if (newEmailError) {
      console.error('❌ Error checking new emails:', newEmailError);
    } else {
      console.log(`Found ${newEmails?.length || 0} total emails for this contact`);
      
      if (newEmails && newEmails.length > 0) {
        console.log('\n📧 Email details:');
        newEmails.forEach((email, i) => {
          console.log(`   ${i + 1}. Status: ${email.status}`);
          console.log(`      Subject: ${email.subject || 'No subject'}`);
          console.log(`      Has HTML: ${!!email.html_body}`);
          console.log(`      Has Text: ${!!email.text_body}`);
          console.log(`      Metadata: ${JSON.stringify(email.metadata)}`);
          console.log(`      Created: ${email.created_at}`);
        });
        
        // 7. Process any pending emails
        if (newEmails.some(email => email.status === 'pending')) {
          console.log('\n📤 Processing pending emails...');
          const response = await fetch('http://localhost:3003/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: testContact.email,
              subject: newEmails[0].subject || 'Welcome!',
              html: newEmails[0].html_body || 'Welcome to our church family!',
              text: newEmails[0].text_body,
              emailType: 'system'
            })
          });
          
          if (response.ok) {
            console.log('✅ Test email sent successfully!');
          } else {
            console.log('❌ Failed to send test email');
          }
        }
      }
    }
    
    // 8. Clean up - delete the test member and contact
    console.log('\n5. Cleaning up test data...');
    await supabase.from('members').delete().eq('contact_id', contact.id);
    await supabase.from('contacts').delete().eq('id', contact.id);
    console.log('✅ Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Error in testMemberAutomation:', error);
  }
}

// Run the test
testMemberAutomation(); 