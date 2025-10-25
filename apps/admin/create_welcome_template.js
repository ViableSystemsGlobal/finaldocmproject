const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ufjfafcfkalaasdhgcbi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA'
);

async function createWelcomeTemplate() {
  console.log('🎯 Creating welcome_member email template...');
  
  // First check if it already exists
  const { data: existing, error: checkError } = await supabase
    .from('comms_defaults')
    .select('*')
    .eq('template_name', 'welcome_member')
    .eq('channel', 'email');

  if (checkError) {
    console.error('❌ Error checking existing template:', checkError);
    return;
  }

  if (existing && existing.length > 0) {
    console.log('✅ Welcome template already exists!');
    console.log('Template details:', JSON.stringify(existing[0], null, 2));
    return;
  }

  // Create the template
  const { data, error } = await supabase
    .from('comms_defaults')
    .insert({
      template_name: 'welcome_member',
      channel: 'email',
      subject: 'Welcome to {{ church_name }}, {{ first_name }}!',
      body: `Dear {{ first_name }},

Welcome to the {{ church_name }} family! We are so excited to have you as part of our community.

You will receive regular updates about church events, services, and opportunities to get involved. 

If you have any questions, please feel free to reach out to us.

Blessings,
The {{ church_name }} Team`,
      variables_schema: [
        { name: 'first_name', description: 'Member first name' },
        { name: 'last_name', description: 'Member last name' },
        { name: 'church_name', description: 'Church name from settings' }
      ],
      is_active: true
    })
    .select();

  if (error) {
    console.error('❌ Error creating template:', error);
    return;
  }

  console.log('✅ Welcome template created successfully!');
  console.log('Template details:', JSON.stringify(data[0], null, 2));
}

createWelcomeTemplate().catch(console.error); 