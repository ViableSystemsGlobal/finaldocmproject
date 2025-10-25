const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugEmailQueue() {
  console.log('🔍 Debugging Email Queue and Automation...\n');
  
  try {
    // 1. Check email_queue table structure
    console.log('1. Checking email_queue table structure...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('email_queue')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('   Error accessing email_queue:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('   Available columns:', Object.keys(sampleData[0]).join(', '));
    } else {
      console.log('   No data in email_queue to check structure, but table exists');
    }
    
    // 2. Check recent email queue entries
    console.log('\n2. Checking recent email queue entries...');
    const { data: recentEmails, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (emailError) {
      console.error('   Error fetching emails:', emailError.message);
    } else {
      console.log(`   Found ${recentEmails?.length || 0} recent emails`);
      recentEmails?.forEach((email, i) => {
        console.log(`   ${i + 1}. To: ${email.to_address}, Status: ${email.status}, Created: ${email.created_at}`);
        if (email.subject) console.log(`      Subject: ${email.subject}`);
        if (email.metadata) console.log(`      Metadata: ${JSON.stringify(email.metadata)}`);
      });
    }
    
    // 3. Check communication templates
    console.log('\n3. Checking communication templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'welcome_member')
      .eq('channel', 'email');
    
    if (templatesError) {
      console.error('   Error fetching templates:', templatesError.message);
    } else {
      console.log(`   Found ${templates?.length || 0} welcome member email templates`);
      templates?.forEach((template, i) => {
        console.log(`   ${i + 1}. Active: ${template.is_active}, Subject: ${template.subject}`);
        console.log(`      Body preview: ${template.body?.substring(0, 100)}...`);
      });
    }
    
    // 4. Check recent members
    console.log('\n4. Checking recent members...');
    const { data: recentMembers, error: membersError } = await supabase
      .from('members')
      .select(`
        contact_id,
        joined_at,
        created_at,
        contacts(id, first_name, last_name, email, lifecycle)
      `)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (membersError) {
      console.error('   Error fetching members:', membersError.message);
    } else {
      console.log(`   Found ${recentMembers?.length || 0} recent members`);
      recentMembers?.forEach((member, i) => {
        const contact = member.contacts;
        console.log(`   ${i + 1}. ${contact?.first_name} ${contact?.last_name} (${contact?.email})`);
        console.log(`      Lifecycle: ${contact?.lifecycle}, Joined: ${member.created_at}`);
      });
    }
    
    // 5. Check if email processing is working
    console.log('\n5. Checking email processing...');
    const { data: pendingEmails, error: pendingError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(10);
    
    if (pendingError) {
      console.error('   Error fetching pending emails:', pendingError.message);
    } else {
      console.log(`   Found ${pendingEmails?.length || 0} pending emails`);
      if (pendingEmails?.length > 0) {
        console.log('   Pending emails:');
        pendingEmails.forEach((email, i) => {
          console.log(`   ${i + 1}. To: ${email.to_address}, Created: ${email.created_at}`);
        });
      }
    }
    
    // 6. Check database triggers
    console.log('\n6. Checking database triggers...');
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, action_timing, event_manipulation')
      .in('trigger_name', ['trigger_auto_welcome_email_simple', 'trigger_lifecycle_welcome_email_simple']);
    
    if (triggersError) {
      console.log('   Could not check triggers directly');
    } else {
      console.log(`   Found ${triggers?.length || 0} automation triggers`);
      triggers?.forEach((trigger, i) => {
        console.log(`   ${i + 1}. ${trigger.trigger_name} on ${trigger.event_object_table} (${trigger.action_timing} ${trigger.event_manipulation})`);
      });
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugEmailQueue(); 