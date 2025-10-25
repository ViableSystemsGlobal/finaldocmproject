import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface WorkflowTrigger {
  type: 'new_member' | 'birthday' | 'visitor_followup' | 'event_reminder'
  contactId?: string
  eventId?: string
}

interface EmailData {
  to_address: string;
  subject: string;
  html_body: string;
  text_body?: string;
  from_address?: string;
}

// Add function to check notification settings
async function shouldSendNotification(notificationType: string, method: string, userRole: string): Promise<boolean> {
  try {
    // Check global settings first
    const { data: globalSettings } = await supabase
      .from('notification_settings')
      .select(`${method}_enabled`)
      .single()

    if (!globalSettings || !globalSettings[`${method}_enabled`]) {
      console.log(`${method} notifications globally disabled`)
      return false
    }

    // Check notification type settings
    const { data: typeSettings } = await supabase
      .from('notification_type_settings')
      .select('enabled, roles')
      .eq('notification_type_id', notificationType)
      .eq('method', method)
      .single()

    if (!typeSettings || !typeSettings.enabled) {
      console.log(`${notificationType} ${method} notifications disabled`)
      return false
    }

    // Check if user role is in the allowed roles
    const allowedRoles = typeSettings.roles || []
    if (!allowedRoles.includes(userRole)) {
      console.log(`${userRole} not allowed for ${notificationType} ${method} notifications`)
      return false
    }

    console.log(`✅ ${notificationType} ${method} notification allowed for ${userRole}`)
    return true
  } catch (error) {
    console.error('Error checking notification settings:', error)
    // Default to allow if there's an error checking settings
    return true
  }
}

// Add function to get users by role for notifications
async function getUsersByRole(roles: string[]): Promise<any[]> {
  try {
    const { data: users } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .in('user_type', roles.map(role => `${role}_staff`))
      .eq('is_active', true)
      .not('email', 'is', null)

    return users || []
  } catch (error) {
    console.error('Error fetching users by role:', error)
    return []
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { trigger }: { trigger: WorkflowTrigger } = await req.json()

    console.log('Executing workflow for trigger:', trigger)

    switch (trigger.type) {
      case 'new_member':
        await executeNewMemberWorkflow(trigger.contactId!)
        break
      case 'birthday':
        await executeBirthdayWorkflows(trigger.contactId)
        break
      case 'visitor_followup':
        await executeVisitorFollowupWorkflows()
        break
      case 'event_reminder':
        await executeEventReminderWorkflows()
        break
      default:
        throw new Error(`Unknown trigger type: ${trigger.type}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: `Workflow executed for ${trigger.type}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error executing workflow:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function executeNewMemberWorkflow(contactId: string) {
  console.log('Executing new member workflow for contact:', contactId)
  
  // Get contact details
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    console.error('Contact not found:', contactError)
    return
  }

  // Send welcome email to the new member (always send to the member themselves)
  if (contact.email) {
    await sendWelcomeEmailToMember(contact)
  }

  // Send notification emails to staff based on notification settings
  await sendNewMemberNotificationToStaff(contact)
}

async function sendWelcomeEmailToMember(contact: any) {
  console.log('Sending welcome email to new member:', contact.email)

  // Get welcome template from comms_defaults table
  const { data: template, error: templateError } = await supabase
    .from('comms_defaults')
    .select('*')
    .eq('template_name', 'welcome_member')
    .single()

  if (templateError || !template) {
    console.error('Welcome template not found:', templateError)
    return
  }

  // Get church settings
  const church = await getChurchSettings()
  
  // Process template variables
  const subject = template.subject || `Welcome to ${church.church_name}!`
  const body = processTemplateVariables(template.body, contact, church)

  // Send email directly (same approach as campaigns)
  const emailResult = await sendEmailDirectly({
    to_address: contact.email,
    subject: subject,
    html_body: body,
    text_body: body.replace(/<[^>]*>/g, '')
  })

  if (emailResult.success) {
    console.log(`✅ Welcome email sent to ${contact.email}:`, emailResult.messageId)
  } else {
    console.error(`❌ Failed to send welcome email to ${contact.email}:`, emailResult.error)
  }
}

async function sendNewMemberNotificationToStaff(contact: any) {
  console.log('Checking if staff should be notified about new member:', contact.first_name, contact.last_name)

  // Check notification settings for member_joined notifications
  const shouldNotifyAdmin = await shouldSendNotification('member_joined', 'email', 'admin')
  const shouldNotifyPastor = await shouldSendNotification('member_joined', 'email', 'pastor')

  if (!shouldNotifyAdmin && !shouldNotifyPastor) {
    console.log('No staff notifications enabled for new members')
    return
  }

  // Get staff users based on notification settings
  const rolesToNotify: string[] = []
  if (shouldNotifyAdmin) rolesToNotify.push('admin')
  if (shouldNotifyPastor) rolesToNotify.push('pastor')

  const staffUsers = await getUsersByRole(rolesToNotify)

  if (staffUsers.length === 0) {
    console.log('No staff users found to notify')
    return
  }

  // Get church settings for notification email
  const church = await getChurchSettings()

  // Create notification email content
  const subject = `New Member Alert: ${contact.first_name} ${contact.last_name} joined ${church.church_name}`
  const body = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🎉 New Member Alert!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #343a40; margin-top: 0;">Member Details:</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Name:</strong> ${contact.first_name} ${contact.last_name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
          <p><strong>Joined:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="margin-bottom: 0;">Please follow up with this new member to ensure they feel welcomed and connected to our church family.</p>
      </div>
    </div>
  `

  // Send notification to each staff member
  for (const staffUser of staffUsers) {
    const emailResult = await sendEmailDirectly({
      to_address: staffUser.email,
      subject: subject,
      html_body: body,
      text_body: `New Member Alert: ${contact.first_name} ${contact.last_name} joined ${church.church_name}. Please follow up to welcome them.`,
      from_address: 'admin@docmchurch.org'
    })

    if (emailResult.success) {
      console.log(`✅ Staff notification sent to ${staffUser.email}:`, emailResult.messageId)
    } else {
      console.error(`❌ Failed to send staff notification to ${staffUser.email}:`, emailResult.error)
    }
  }
}

async function executeBirthdayWorkflows(specificContactId?: string) {
  console.log('Executing birthday workflows', specificContactId ? `for contact: ${specificContactId}` : 'for all birthdays today')
  
  let birthdayContacts: any[]
  
  if (specificContactId) {
    // Manual trigger for specific contact - send birthday email regardless of date
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', specificContactId)
      .not('email', 'is', null)
      .single()

    if (error || !contact) {
      console.error('Error fetching specific contact:', error)
      return
    }
    
    birthdayContacts = [contact]
    console.log(`Sending birthday email to specific contact: ${contact.first_name} ${contact.last_name}`)
  } else {
    // Scheduled trigger - get contacts with birthdays today
    const today = new Date()
    const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .not('date_of_birth', 'is', null)
      .not('email', 'is', null)
      .filter('date_of_birth', 'like', `%-${todayString}`)

    if (error) {
      console.error('Error fetching birthday contacts:', error)
      return
    }

    if (!contacts || contacts.length === 0) {
      console.log('No birthdays today')
      return
    }
    
    birthdayContacts = contacts
  }

  // Get birthday template (try birthday_greeting first, then birthday_reminder for backwards compatibility)
  let template, templateError
  
  const { data: greetingTemplate, error: greetingError } = await supabase
    .from('comms_defaults')
    .select('*')
    .eq('template_name', 'birthday_greeting')
    .eq('channel', 'email')
    .single()

  if (greetingTemplate && !greetingError) {
    template = greetingTemplate
  } else {
    const { data: reminderTemplate, error: reminderError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'birthday_reminder')
      .eq('channel', 'email')
      .single()
    
    template = reminderTemplate
    templateError = reminderError
  }

  if (templateError || !template) {
    console.error('Birthday template not found:', templateError)
    return
  }

  const church = await getChurchSettings()
  
  // Send birthday emails
  for (const contact of birthdayContacts) {
    const subject = processTemplateVariables(template.subject, contact, church)
    const body = processTemplateVariables(template.body, contact, church)
    
    await queueEmail(contact.email, subject, body, template.template_name, contact.id, 'system')
  }

  console.log(`Sent ${birthdayContacts.length} birthday emails`)
}

async function executeVisitorFollowupWorkflows() {
  console.log('Executing visitor follow-up workflows')
  
  // Get visitors from 2-3 days ago who haven't been followed up
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  
  const { data: visitors, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('lifecycle', 'visitor')
    .not('email', 'is', null)
    .gte('created_at', twoDaysAgo.toISOString())
    .lte('created_at', threeDaysAgo.toISOString())

  if (error) {
    console.error('Error fetching visitors:', error)
    return
  }

  if (!visitors || visitors.length === 0) {
    console.log('No visitors to follow up with')
    return
  }

  // Get follow-up template
  const { data: template, error: templateError } = await supabase
    .from('comms_defaults')
    .select('*')
    .eq('template_name', 'follow_up_visitor')
    .eq('channel', 'email')
    .single()

  if (templateError || !template) {
    console.error('Follow-up template not found:', templateError)
    return
  }

  const church = await getChurchSettings()
  
  // Send follow-up emails
  for (const visitor of visitors) {
    // Check if we already sent a follow-up
    const { data: existing } = await supabase
      .from('email_queue')
      .select('id')
      .eq('to_address', visitor.email)
      .contains('metadata', { template_type: 'follow_up_visitor', contact_id: visitor.id })

    if (existing && existing.length > 0) {
      console.log(`Already sent follow-up to ${visitor.email}`)
      continue
    }

    const subject = processTemplateVariables(template.subject, visitor, church)
    const body = processTemplateVariables(template.body, visitor, church)
    
    await queueEmail(visitor.email, subject, body, 'follow_up_visitor', visitor.id, 'system')
  }

  console.log(`Sent ${visitors.length} visitor follow-up emails`)
}

async function executeEventReminderWorkflows() {
  console.log('Executing event reminder workflows')
  
  // Get events happening tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
  const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('event_date', tomorrowStart.toISOString())
    .lt('event_date', tomorrowEnd.toISOString())

  if (error) {
    console.error('Error fetching events:', error)
    return
  }

  if (!events || events.length === 0) {
    console.log('No events tomorrow')
    return
  }

  // Get event reminder template
  const { data: template, error: templateError } = await supabase
    .from('comms_defaults')
    .select('*')
    .eq('template_name', 'event_reminder')
    .eq('channel', 'email')
    .single()

  if (templateError || !template) {
    console.error('Event reminder template not found:', templateError)
    return
  }

  const church = await getChurchSettings()
  
  // For each event, send reminders to members
  for (const event of events) {
    // Get all contacts with email addresses
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .not('email', 'is', null)
      .in('lifecycle', ['member', 'regular_attendee'])

    if (contactsError || !contacts) {
      console.error('Error fetching contacts for event reminders:', contactsError)
      continue
    }

    // Send email reminders
    for (const contact of contacts) {
      const eventTime = new Date(event.event_date).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })

      const templateVars = {
        ...contact,
        event_name: event.name,
        event_time: eventTime,
        event_date: new Date(event.event_date).toLocaleDateString()
      }

      const subject = processTemplateVariables(template.subject, templateVars, church)
      const body = processTemplateVariables(template.body, templateVars, church)
      
      await queueEmail(contact.email, subject, body, 'event_reminder', contact.id, 'system')
    }
  }
}

async function getChurchSettings() {
  const { data: settings, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching church settings:', error)
    return { church_name: 'Our Church' }
  }

  return {
    church_name: settings?.name || 'Our Church'
  }
}

function processTemplateVariables(template: string, contact: any, church: any): string {
  let processed = template
  
  // Replace contact variables
  processed = processed.replace(/\{\{\s*first_name\s*\}\}/g, contact.first_name || '')
  processed = processed.replace(/\{\{\s*last_name\s*\}\}/g, contact.last_name || '')
  processed = processed.replace(/\{\{\s*full_name\s*\}\}/g, `${contact.first_name || ''} ${contact.last_name || ''}`.trim())
  
  // Replace church variables
  processed = processed.replace(/\{\{\s*church_name\s*\}\}/g, church.church_name || 'Our Church')
  
  // Replace any additional variables passed in
  for (const [key, value] of Object.entries(contact)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    processed = processed.replace(regex, String(value || ''))
  }
  
  return processed
}

async function queueEmail(toAddress: string, subject: string, body: string, templateType: string, contactId: string, emailType: string) {
  if (!toAddress) {
    console.log('No email address provided, skipping email')
    return
  }

  try {
    // Generate a unique message ID
    const messageId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Directly insert into email_queue table
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        message_id: messageId,
        to_address: toAddress,
        from_address: 'admin@docmchurch.org',
        subject: subject,
        html_body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${body.replace(/\n/g, '<br>')}</div>`,
        text_body: body,
        status: 'pending',
        metadata: {
          template_type: templateType,
          contact_id: contactId,
          sent_via: 'workflow_automation',
          email_type: emailType
        },
        max_attempts: 3,
        attempts: 0
      })
    
    if (error) {
      console.error(`Failed to queue ${templateType} email to ${toAddress}:`, error)
    } else {
      console.log(`Successfully queued ${templateType} email to ${toAddress}`)
    }
  } catch (error) {
    console.error(`Error queueing ${templateType} email to ${toAddress}:`, error)
  }
}

// Direct SMTP email sending function (bypasses queue like campaigns do)
async function sendEmailDirectly(emailData: EmailData): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log('🚀 Sending email directly via SMTP:', {
      to: emailData.to_address,
      subject: emailData.subject,
      hasHtml: !!emailData.html_body
    });

    // Since we can't call localhost from edge functions, we'll use a different approach
    // For now, let's fall back to the queue method but mark it as high priority
    console.log('📧 Falling back to email queue with high priority...');
    
    // Generate a unique message ID
    const messageId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert directly into email_queue table with high priority
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        message_id: messageId,
        to_address: emailData.to_address,
        from_address: 'admin@docmchurch.org',
        subject: emailData.subject,
        html_body: emailData.html_body,
        text_body: emailData.text_body || emailData.html_body.replace(/<[^>]*>/g, ''),
        status: 'pending',
        metadata: {
          source: 'workflow-automation',
          priority: 'high',
          email_type: 'system',
          timestamp: new Date().toISOString()
        },
        max_attempts: 3,
        attempts: 0,
        next_attempt_at: new Date().toISOString() // Send immediately
      });

    if (error) {
      console.error('❌ Failed to queue email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email queued successfully with high priority:', messageId);
    return { 
      success: true, 
      messageId: messageId 
    };

  } catch (error) {
    console.error('💥 Error in sendEmailDirectly:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function executeEmailStep(step: any, context: any): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Executing email step:', step.id, step.settings);
    
    // Get church settings for template variables
    const { data: churchSettings } = await supabase
      .from('tenant_settings')
      .select('*')
      .single();
    
    if (!churchSettings) {
      console.error('❌ No church settings found');
      return { success: false, error: 'Church settings not found' };
    }

    console.log('🏛️ Church settings loaded:', { name: churchSettings.name });

    // Get email template
    const templateName = step.settings?.template_name || 'welcome_member';
    console.log('📝 Looking for template:', templateName);
    
    const { data: template } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', templateName)
      .single();

    if (!template) {
      console.error('❌ Email template not found:', templateName);
      return { success: false, error: `Template '${templateName}' not found` };
    }

    console.log('📄 Template found:', template.template_name, template.body?.substring(0, 50) + '...');

    // Prepare template variables
    const templateVariables = {
      church_name: churchSettings.name,
      member_name: context.member?.first_name || context.member?.name || 'Friend',
      first_name: context.member?.first_name || 'Friend',
      ...context
    };

    console.log('🔧 Template variables:', templateVariables);

    // Process template
    let emailContent = template.body || 'Welcome!';
    let emailSubject = step.settings?.subject || `Welcome to ${churchSettings.name}!`;

    // Replace template variables
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      emailContent = emailContent.replace(regex, String(value));
      emailSubject = emailSubject.replace(regex, String(value));
    });

    console.log('📨 Final email content prepared:', {
      subject: emailSubject,
      contentLength: emailContent.length,
      to: context.member?.email
    });

    // Send email directly (same as campaigns)
    const emailResult = await sendEmailDirectly({
      to_address: context.member?.email,
      subject: emailSubject,
      html_body: emailContent,
      text_body: emailContent.replace(/<[^>]*>/g, '')
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send email:', emailResult.error);
      return { success: false, error: emailResult.error };
    }

    console.log('✅ Email sent successfully:', emailResult.messageId);
    return { success: true };

  } catch (error) {
    console.error('💥 Error in executeEmailStep:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 