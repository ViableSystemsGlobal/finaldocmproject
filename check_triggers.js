const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggers() {
  console.log('🔍 Checking database triggers...\n');
  
  try {
    // Check if triggers exist
    console.log('1. Checking if triggers exist...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .in('trigger_name', ['trigger_auto_welcome_email_simple', 'trigger_lifecycle_welcome_email_simple']);
    
    if (triggerError) {
      console.log('   Could not query triggers directly, trying alternative method...');
      
      // Try using a custom query
      const { data: triggerData, error: customError } = await supabase
        .rpc('execute_sql', {
          sql: `
            SELECT trigger_name, event_object_table, action_timing, event_manipulation
            FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_auto_welcome_email_simple', 'trigger_lifecycle_welcome_email_simple');
          `
        });
      
      if (customError) {
        console.error('   Error checking triggers:', customError);
      } else {
        console.log(`   Found ${triggerData?.length || 0} triggers via custom query`);
        triggerData?.forEach(trigger => {
          console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
        });
      }
    } else {
      console.log(`   Found ${triggers?.length || 0} triggers`);
      triggers?.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
      });
    }
    
    // Check if functions exist
    console.log('\n2. Checking if trigger functions exist...');
    const { data: functions, error: functionError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT proname, prosrc 
          FROM pg_proc 
          WHERE proname IN ('auto_send_welcome_email_simple', 'auto_send_lifecycle_welcome_email_simple');
        `
      });
    
    if (functionError) {
      console.error('   Error checking functions:', functionError);
    } else {
      console.log(`   Found ${functions?.length || 0} trigger functions`);
      functions?.forEach(func => {
        console.log(`   - ${func.proname}`);
      });
    }
    
    // Test the function manually
    console.log('\n3. Testing trigger function manually...');
    
    // Get a test contact
    const { data: testContact } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('email', 'test.automation@example.com')
      .limit(1)
      .single();
    
    if (!testContact) {
      console.log('   No test contact found, creating one...');
      
      // Get tenant_id
      const { data: tenantData } = await supabase
        .from('tenant_settings')
        .select('id')
        .limit(1)
        .single();
      
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          first_name: 'Test',
          last_name: 'Trigger',
          email: 'test.trigger@example.com',
          lifecycle: 'contact',
          tenant_id: tenantData.id
        })
        .select()
        .single();
      
      if (newContact) {
        console.log(`   Created test contact: ${newContact.id}`);
        
        // Try to create a member (this should trigger the automation)
        console.log('   Creating member to test trigger...');
        const { data: member, error: memberError } = await supabase
          .from('members')
          .insert({
            contact_id: newContact.id,
            joined_at: new Date().toISOString(),
            notes: 'Trigger test'
          })
          .select()
          .single();
        
        if (memberError) {
          console.error('   Error creating member:', memberError);
        } else {
          console.log(`   Created member: ${member.contact_id}`);
          
          // Wait and check for emails
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: emails } = await supabase
            .from('email_queue')
            .select('*')
            .eq('to_address', 'test.trigger@example.com')
            .order('created_at', { ascending: false });
          
          console.log(`   Found ${emails?.length || 0} emails for test contact`);
          if (emails && emails.length > 0) {
            console.log(`   ✅ Trigger worked! Email queued with subject: "${emails[0].subject}"`);
          } else {
            console.log('   ❌ Trigger did not work - no emails found');
          }
          
          // Clean up
          await supabase.from('members').delete().eq('contact_id', newContact.id);
          await supabase.from('contacts').delete().eq('id', newContact.id);
          console.log('   Cleaned up test data');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in checkTriggers:', error);
  }
}

// Run the check
checkTriggers(); 