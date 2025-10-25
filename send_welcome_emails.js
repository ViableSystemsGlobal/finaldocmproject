const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendWelcomeEmails() {
  console.log('📧 Sending welcome emails to recent members...\n');
  
  try {
    // 1. Get recent members who might not have received welcome emails
    console.log('1. Finding recent members...');
    const { data: recentMembers, error: membersError } = await supabase
      .from('members')
      .select(`
        contact_id,
        joined_at,
        created_at,
        contacts(id, first_name, last_name, email, lifecycle)
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false });
    
    if (membersError) {
      console.error('❌ Error fetching members:', membersError);
      return;
    }
    
    console.log(`Found ${recentMembers?.length || 0} recent members`);
    
    if (!recentMembers || recentMembers.length === 0) {
      console.log('✅ No recent members found');
      return;
    }
    
    // 2. Get welcome template
    console.log('\n2. Getting welcome template...');
    const { data: template, error: templateError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'welcome_member')
      .eq('channel', 'email')
      .eq('is_active', true)
      .single();
    
    if (templateError || !template) {
      console.error('❌ Error fetching template:', templateError);
      return;
    }
    
    console.log(`✅ Found template: "${template.subject}"`);
    
    // 3. Get church settings
    const { data: churchSettings } = await supabase
      .from('tenant_settings')
      .select('church_name')
      .limit(1)
      .single();
    
    const churchName = churchSettings?.church_name || 'Our Church';
    console.log(`✅ Church name: ${churchName}`);
    
    // 4. Process each member
    console.log('\n3. Processing members...');
    let processed = 0;
    let sent = 0;
    let skipped = 0;
    
    for (const member of recentMembers) {
      const contact = member.contacts;
      
      if (!contact || !contact.email) {
        console.log(`   Skipping ${contact?.first_name || 'Unknown'} - no email`);
        skipped++;
        continue;
      }
      
      // Check if they already have a welcome email
      const { data: existingEmails } = await supabase
        .from('email_queue')
        .select('id')
        .eq('to_address', contact.email)
        .contains('metadata', { template_type: 'welcome_member' });
      
      if (existingEmails && existingEmails.length > 0) {
        console.log(`   Skipping ${contact.first_name} ${contact.last_name} - already has welcome email`);
        skipped++;
        continue;
      }
      
      console.log(`   Processing ${contact.first_name} ${contact.last_name} (${contact.email})`);
      
      // Process template variables
      let processedSubject = template.subject || 'Welcome!';
      let processedBody = template.body || 'Welcome to our church family!';
      
      // Replace variables
      processedSubject = processedSubject.replace(/\{\{\s*church_name\s*\}\}/g, churchName);
      processedSubject = processedSubject.replace(/\{\{\s*first_name\s*\}\}/g, contact.first_name || '');
      
      processedBody = processedBody.replace(/\{\{\s*church_name\s*\}\}/g, churchName);
      processedBody = processedBody.replace(/\{\{\s*first_name\s*\}\}/g, contact.first_name || '');
      processedBody = processedBody.replace(/\{\{\s*last_name\s*\}\}/g, contact.last_name || '');
      
      // Create email queue entry
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
          sent_via: 'manual_welcome_script',
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
        console.error(`   ❌ Error queuing email for ${contact.first_name}:`, queueError);
        continue;
      }
      
      // Send the email immediately
      try {
        const response = await fetch('http://localhost:3003/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.email,
            subject: processedSubject,
            html: emailData.html_body,
            text: emailData.text_body,
            emailType: 'system'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Email sent to ${contact.first_name}: ${result.messageId}`);
          
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', queueEntry.id);
          
          sent++;
        } else {
          const errorText = await response.text();
          console.error(`   ❌ Failed to send to ${contact.first_name}: ${response.status} ${errorText}`);
          
          // Mark as failed
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: `HTTP ${response.status}: ${errorText}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', queueEntry.id);
        }
      } catch (error) {
        console.error(`   ❌ Error sending to ${contact.first_name}:`, error.message);
      }
      
      processed++;
      
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Welcome email processing complete!');
    console.log(`📊 Summary:`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Sent: ${sent}`);
    console.log(`   Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Error in sendWelcomeEmails:', error);
  }
}

// Run the script
sendWelcomeEmails(); 