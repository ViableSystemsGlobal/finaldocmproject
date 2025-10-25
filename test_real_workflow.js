const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendWelcomeEmailDirectly(contactId) {
  try {
    console.log('📧 Sending welcome email directly for contact:', contactId);

    // 1. Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      console.error('❌ Contact not found:', contactError);
      return { success: false, error: 'Contact not found' };
    }

    if (!contact.email) {
      console.log('⚠️ Contact has no email address, skipping welcome email');
      return { success: true, message: 'No email address provided' };
    }

    // 2. Get welcome template
    const { data: template, error: templateError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'welcome_member')
      .single();

    if (templateError || !template) {
      console.error('❌ Welcome template not found:', templateError);
      return { success: false, error: 'Welcome template not found' };
    }

    console.log('📄 Template found:', template.template_name);

    // 3. Get church settings
    const { data: churchSettings, error: churchError } = await supabase
      .from('tenant_settings')
      .select('*')
      .single();

    if (churchError || !churchSettings) {
      console.error('❌ Church settings not found:', churchError);
      return { success: false, error: 'Church settings not found' };
    }

    console.log('🏛️ Church settings found:', churchSettings.name);

    // 4. Process template variables
    let emailContent = template.body || 'Welcome to our church!';
    let emailSubject = template.subject || `Welcome to ${churchSettings.name}!`;

    // Replace template variables
    const templateVariables = {
      church_name: churchSettings.name,
      first_name: contact.first_name || 'Friend',
      last_name: contact.last_name || '',
      full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    };

    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      emailContent = emailContent.replace(regex, String(value));
      emailSubject = emailSubject.replace(regex, String(value));
    });

    console.log('📨 Email prepared:', {
      to: contact.email,
      subject: emailSubject,
      contentLength: emailContent.length
    });

    // 5. Send email using bypass-queue (same as campaigns)
    console.log('🚀 Sending email via bypass-queue endpoint...');
    const response = await fetch('http://localhost:3003/api/email/bypass-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: contact.email,
        subject: emailSubject,
        html: emailContent,
        text: emailContent.replace(/<[^>]*>/g, ''),
        emailType: 'system',
        metadata: {
          source: 'workflow-automation',
          contact_id: contactId,
          template_name: 'welcome_member',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Bypass queue API error:', response.status, errorText);
      return { success: false, error: `Email sending failed: ${errorText}` };
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Bypass queue API returned error:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Welcome email sent successfully via bypass queue:', result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      message: 'Welcome email sent successfully via bypass queue'
    };

  } catch (error) {
    console.error('💥 Error sending welcome email directly:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function testRealWorkflow() {
  console.log('🧪 Testing REAL workflow with admin app on port 3003...\n');

  try {
    // 1. Create a test contact
    const timestamp = Date.now();
    const testContact = {
      first_name: 'Real',
      last_name: 'Workflow-Test',
      email: `realworkflow.test.${timestamp}@example.com`,
      phone: `+123456${timestamp.toString().slice(-4)}`,
      lifecycle: 'visitor',
      tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    };

    console.log('👤 Creating test contact:', testContact.email);
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .insert(testContact)
      .select()
      .single();

    if (contactError) {
      console.error('❌ Error creating contact:', contactError);
      return;
    }

    console.log('✅ Contact created:', contactData.id);

    // 2. Test the REAL workflow function with REAL email sending
    console.log('\n🚀 Testing REAL welcome email workflow...');
    const workflowResult = await sendWelcomeEmailDirectly(contactData.id);
    
    if (workflowResult.success) {
      console.log('🎉 WORKFLOW COMPLETED SUCCESSFULLY!');
      console.log('✅ Message:', workflowResult.message);
      console.log('📧 Message ID:', workflowResult.messageId);
      console.log('\n🎯 AUTOMATIC WELCOME EMAILS ARE NOW WORKING!');
    } else {
      console.error('❌ Workflow failed:', workflowResult.error);
    }

    // 3. Clean up
    console.log('\n🧹 Cleaning up...');
    await supabase.from('contacts').delete().eq('id', contactData.id);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testRealWorkflow().catch(console.error); 