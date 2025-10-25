const { createClient } = require('@supabase/supabase-js');

async function createWelcomeTemplate() {
  const supabase = createClient(
    'https://ufjfafcfkalaasdhgcbi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA'
  );

  console.log('🎯 Creating welcome_member email template...');
  
  try {
    // First check if it already exists
    const { data: existing } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'welcome_member')
      .eq('channel', 'email');

    if (existing && existing.length > 0) {
      console.log('✅ Welcome template already exists!');
      return;
    }

    // Create the template
    const { data, error } = await supabase
      .from('comms_defaults')
      .insert({
        template_name: 'welcome_member',
        channel: 'email',
        subject: 'Welcome to {{ church_name }}, {{ first_name }}!',
        body: 'Dear {{ first_name }},\n\nWelcome to the {{ church_name }} family! We are so excited to have you as part of our community.\n\nYou will receive regular updates about church events, services, and opportunities to get involved.\n\nIf you have any questions, please feel free to reach out to us.\n\nBlessings,\nThe {{ church_name }} Team',
        is_active: true
      })
      .select();

    if (error) {
      console.error('❌ Error creating template:', error);
      return;
    }

    console.log('✅ Welcome template created successfully!');
    console.log('Template ID:', data[0].id);

    // Now test the workflow automation with a manual trigger
    console.log('\n🔍 Testing workflow automation...');
    
    // Trigger the new member workflow manually
    const workflowResponse = await fetch('https://ufjfafcfkalaasdhgcbi.supabase.co/functions/v1/execute-workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ3MTMsImV4cCI6MjA2MzI5MDcxM30.PzwQAeRUJDK8llZf0awLwgW6j-pAmZPOgz55USsOnyo'
      },
      body: JSON.stringify({
        trigger: {
          type: 'new_member',
          contactId: '12f2dcac-0b99-4c07-8164-0a3d4b469a16'
        }
      })
    });

    const workflowResult = await workflowResponse.json();
    console.log('🚀 Workflow test result:', workflowResult);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createWelcomeTemplate(); 