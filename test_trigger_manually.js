const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTriggerManually() {
  console.log('🔧 Testing trigger logic manually...\n');
  
  try {
    // 1. Get a recent member
    const { data: recentMember } = await supabase
      .from('members')
      .select(`
        contact_id,
        contacts(id, first_name, last_name, email, lifecycle)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!recentMember) {
      console.log('❌ No members found');
      return;
    }
    
    const contact = recentMember.contacts;
    console.log(`📋 Testing with member: ${contact.first_name} ${contact.last_name} (${contact.email})`);
    
    // 2. Check if welcome template exists
    console.log('\n🔍 Checking welcome template...');
    const { data: template, error: templateError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'welcome_member')
      .eq('channel', 'email')
      .eq('is_active', true)
      .single();
    
    if (templateError) {
      console.error('❌ Error fetching template:', templateError);
      return;
    }
    
    if (!template) {
      console.log('❌ No active welcome template found');
      return;
    }
    
    console.log(`✅ Found template: "${template.subject}"`);
    console.log(`   Body preview: ${template.body?.substring(0, 100)}...`);
    
    // 3. Get church settings
    console.log('\n🏛️ Getting church settings...');
    const { data: churchSettings } = await supabase
      .from('tenant_settings')
      .select('church_name')
      .limit(1)
      .single();
    
    const churchName = churchSettings?.church_name || 'Our Church';
    console.log(`✅ Church name: ${churchName}`);
    
    // 4. Process template variables manually
    console.log('\n🔄 Processing template variables...');
    let processedSubject = template.subject || 'Welcome!';
    let processedBody = template.body || 'Welcome to our church family!';
    
    // Replace variables
    processedSubject = processedSubject.replace(/\{\{\s*church_name\s*\}\}/g, churchName);
    processedSubject = processedSubject.replace(/\{\{\s*first_name\s*\}\}/g, contact.first_name || '');
    
    processedBody = processedBody.replace(/\{\{\s*church_name\s*\}\}/g, churchName);
    processedBody = processedBody.replace(/\{\{\s*first_name\s*\}\}/g, contact.first_name || '');
    processedBody = processedBody.replace(/\{\{\s*last_name\s*\}\}/g, contact.last_name || '');
    
    console.log(`✅ Processed subject: "${processedSubject}"`);
    console.log(`✅ Processed body preview: ${processedBody.substring(0, 100)}...`);
    
    // 5. Manually create the email queue entry
    console.log('\n📧 Manually creating email queue entry...');
    const emailData = {
      message_id: crypto.randomUUID(),
      to_address: contact.email,
      from_address: 'info@docmchurch.org',
      subject: processedSubject,
      html_body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${processedBody.replace(/\n/g, '<br>')}</div>`,
      text_body: processedBody,
      metadata: {
        template_type: 'welcome_member',
        contact_id: contact.id,
        sent_via: 'manual_test',
        triggered_at: new Date().toISOString(),
        email_type: 'system'
      },
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
      next_attempt_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const { data: queueEntry, error: queueError } = await supabase
      .from('email_queue')
      .insert(emailData)
      .select()
      .single();
    
    if (queueError) {
      console.error('❌ Error creating email queue entry:', queueError);
      return;
    }
    
    console.log(`✅ Created email queue entry: ${queueEntry.id}`);
    console.log(`   To: ${queueEntry.to_address}`);
    console.log(`   Subject: ${queueEntry.subject}`);
    
    // 6. Send the email immediately
    console.log('\n📤 Sending email...');
    const response = await fetch('http://localhost:3003/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: queueEntry.to_address,
        subject: queueEntry.subject,
        html: queueEntry.html_body,
        text: queueEntry.text_body,
        emailType: 'system'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Email sent successfully: ${result.messageId}`);
      
      // Mark as sent
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', queueEntry.id);
      
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to send email: ${response.status} ${errorText}`);
    }
    
    console.log('\n✅ Manual trigger test complete!');
    
  } catch (error) {
    console.error('❌ Error in testTriggerManually:', error);
  }
}

// Run the test
testTriggerManually(); 