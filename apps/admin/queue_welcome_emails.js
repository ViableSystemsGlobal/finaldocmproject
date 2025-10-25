const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ufjfafcfkalaasdhgcbi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA'
);

async function queueWelcomeEmails() {
  console.log('📧 Queuing welcome emails for recent members...');
  
  try {
    // Get recent members who don't have welcome emails yet
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24*60*60*1000);
    
    const { data: recentMembers, error: membersError } = await supabase
      .from('members')
      .select(`
        contact_id,
        created_at,
        contacts(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('❌ Error fetching members:', membersError);
      return;
    }

    console.log(`Found ${recentMembers?.length || 0} recent members`);

    if (!recentMembers || recentMembers.length === 0) {
      console.log('No recent members found');
      return;
    }

    // Check which ones already have welcome emails
    const emailAddresses = recentMembers
      .filter(m => m.contacts?.email)
      .map(m => m.contacts.email);

    const { data: existingEmails } = await supabase
      .from('email_queue')
      .select('to_address, metadata')
      .in('to_address', emailAddresses)
      .contains('metadata', { template_type: 'welcome_member' });

    const existingEmailAddresses = new Set(existingEmails?.map(e => e.to_address) || []);

    // Queue welcome emails for members who don't have them
    let queuedCount = 0;
    
    for (const member of recentMembers) {
      const contact = member.contacts;
      
      if (!contact?.email) {
        console.log(`⚠️  Skipping ${contact?.first_name || 'Unknown'} - no email address`);
        continue;
      }

      if (existingEmailAddresses.has(contact.email)) {
        console.log(`⚠️  Skipping ${contact.first_name} - welcome email already exists`);
        continue;
      }

      // Create welcome email
      const subject = `Welcome to Our Church, ${contact.first_name}!`;
      const textBody = `Dear ${contact.first_name},

Welcome to the Our Church family! We are so excited to have you as part of our community.

You will receive regular updates about church events, services, and opportunities to get involved.

If you have any questions, please feel free to reach out to us.

Blessings,
The Our Church Team`;

      const htmlBody = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Dear ${contact.first_name},</p>
        <p>Welcome to the <strong>Our Church</strong> family! We are so excited to have you as part of our community.</p>
        <p>You will receive regular updates about church events, services, and opportunities to get involved.</p>
        <p>If you have any questions, please feel free to reach out to us.</p>
        <p>Blessings,<br>The Our Church Team</p>
      </div>`;

      const { error: queueError } = await supabase
        .from('email_queue')
        .insert({
          message_id: crypto.randomUUID(),
          to_address: contact.email,
          from_address: 'info@docmchurch.org',
          subject: subject,
          html_body: htmlBody,
          text_body: textBody,
          metadata: {
            template_type: 'welcome_member',
            contact_id: contact.id,
            sent_via: 'manual_queue',
            triggered_at: new Date().toISOString(),
            email_type: 'system'
          },
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
          next_attempt_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (queueError) {
        console.error(`❌ Error queuing email for ${contact.first_name}:`, queueError);
      } else {
        console.log(`✅ Welcome email queued for ${contact.first_name} ${contact.last_name} (${contact.email})`);
        queuedCount++;
      }
    }

    console.log(`\n🎉 Successfully queued ${queuedCount} welcome emails!`);
    
    if (queuedCount > 0) {
      console.log('\n📬 Emails will be processed by the email queue system within the next 5 minutes.');
      console.log('💡 To check email status, look in the email_queue table in your database.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

queueWelcomeEmails(); 