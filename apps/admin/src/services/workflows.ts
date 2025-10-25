/**
 * Workflow service for triggering automated workflows
 */

import { supabase } from '@/lib/supabase'

export async function triggerWorkflow(type: string, contactId: string, eventId?: string) {
  try {
    console.log('Triggering workflow:', { type, contactId, eventId })

    // Route to appropriate workflow handler
    switch (type) {
      case 'new_member':
        return await sendWelcomeEmailDirectly(contactId)
      
      case 'birthday':
        return await sendBirthdayEmailDirectly(contactId)
      
      case 'visitor_followup':
        return await sendVisitorFollowupEmailDirectly(contactId)
      
      case 'event_reminder':
        return await sendEventReminderEmailDirectly(contactId, eventId)
      
      default:
        console.log('Workflow type not implemented for direct execution:', type)
        return { success: false, error: `Workflow type '${type}' not implemented` }
    }

  } catch (error) {
    console.error('Error triggering workflow:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

async function sendWelcomeEmailDirectly(contactId: string) {
  try {
    console.log('Sending welcome email directly for contact:', contactId)

    // 1. Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      console.error('Contact not found:', contactError)
      return { success: false, error: 'Contact not found' }
    }

    if (!contact.email) {
      console.log('Contact has no email address, skipping welcome email')
      return { success: true, message: 'No email address provided' }
    }

    // 2. Get welcome template
    const { data: template, error: templateError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'welcome_member')
      .single()

    if (templateError || !template) {
      console.error('Welcome template not found:', templateError)
      return { success: false, error: 'Welcome template not found' }
    }

    // 3. Get church settings
    const { data: churchSettings, error: churchError } = await supabase
      .from('tenant_settings')
      .select('*')
      .single()

    if (churchError || !churchSettings) {
      console.error('Church settings not found:', churchError)
      return { success: false, error: 'Church settings not found' }
    }

    // 4. Process template variables
    let emailContent = template.body || 'Welcome to our church!'
    let emailSubject = template.subject || `Welcome to ${churchSettings.name}!`

    // Replace template variables
    const templateVariables = {
      church_name: churchSettings.name,
      first_name: contact.first_name || 'Friend',
      last_name: contact.last_name || '',
      full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    }

    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      emailContent = emailContent.replace(regex, String(value))
      emailSubject = emailSubject.replace(regex, String(value))
    })

    console.log('Sending welcome email:', {
      to: contact.email,
      subject: emailSubject,
      contentLength: emailContent.length
    })

    // 5. Send email using bypass-queue (same as campaigns)
    const response = await fetch('/api/email/bypass-queue', {
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
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Bypass queue API error:', response.status, errorText)
      return { success: false, error: `Email sending failed: ${errorText}` }
    }

    const result = await response.json()
    
    if (!result.success) {
      console.error('Bypass queue API returned error:', result.error)
      return { success: false, error: result.error }
    }

    console.log('Welcome email sent successfully:', result.messageId)
    return { 
      success: true, 
      messageId: result.messageId,
      message: 'Welcome email sent successfully'
    }

  } catch (error) {
    console.error('Error sending welcome email directly:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

async function sendBirthdayEmailDirectly(contactId: string) {
  return await sendEmailFromTemplate(contactId, 'birthday_greeting', 'Happy Birthday!')
}

async function sendVisitorFollowupEmailDirectly(contactId: string) {
  return await sendEmailFromTemplate(contactId, 'visitor_followup', 'Thank you for visiting us!')
}

async function sendEventReminderEmailDirectly(contactId: string, eventId?: string) {
  return await sendEmailFromTemplate(contactId, 'event_reminder', 'Event Reminder', eventId)
}

async function sendEmailFromTemplate(contactId: string, templateName: string, defaultSubject: string, eventId?: string) {
  try {
    console.log(`Sending ${templateName} email directly for contact:`, contactId)

    // 1. Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      console.error('Contact not found:', contactError)
      return { success: false, error: 'Contact not found' }
    }

    if (!contact.email) {
      console.log('Contact has no email address, skipping email')
      return { success: true, message: 'No email address provided' }
    }

    // 2. Get email template
    const { data: template, error: templateError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', templateName)
      .single()

    if (templateError || !template) {
      console.warn(`${templateName} template not found, using default message`)
    }

    // 3. Get church settings
    const { data: churchSettings, error: churchError } = await supabase
      .from('tenant_settings')
      .select('*')
      .single()

    if (churchError || !churchSettings) {
      console.error('Church settings not found:', churchError)
      return { success: false, error: 'Church settings not found' }
    }

    // 4. Get event details if needed
    let eventDetails = null
    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (!eventError && event) {
        eventDetails = event
      }
    }

    // 5. Process template variables
    let emailContent = template?.body || `Hello ${contact.first_name || 'Friend'}!`
    let emailSubject = template?.subject || `${defaultSubject} - ${churchSettings.name}`

    // Create template variables object
    const templateVariables: { [key: string]: string } = {
      church_name: churchSettings.name,
      first_name: contact.first_name || 'Friend',
      last_name: contact.last_name || '',
      full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    }

    // Add event variables if available
    if (eventDetails) {
      templateVariables.event_name = eventDetails.name || 'Event'
      templateVariables.event_date = eventDetails.start_date ? new Date(eventDetails.start_date).toLocaleDateString() : 'TBD'
      templateVariables.event_time = eventDetails.start_time || 'TBD'
      templateVariables.event_location = eventDetails.location || 'TBD'
    }

    // Replace template variables
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      emailContent = emailContent.replace(regex, String(value))
      emailSubject = emailSubject.replace(regex, String(value))
    })

    console.log(`Sending ${templateName} email:`, {
      to: contact.email,
      subject: emailSubject,
      contentLength: emailContent.length
    })

    // 6. Send email using bypass-queue (same as campaigns)
    const response = await fetch('/api/email/bypass-queue', {
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
          template_name: templateName,
          event_id: eventId,
          timestamp: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Bypass queue API error:', response.status, errorText)
      return { success: false, error: `Email sending failed: ${errorText}` }
    }

    const result = await response.json()
    
    if (!result.success) {
      console.error('Bypass queue API returned error:', result.error)
      return { success: false, error: result.error }
    }

    console.log(`${templateName} email sent successfully:`, result.messageId)
    return { 
      success: true, 
      messageId: result.messageId,
      message: `${templateName} email sent successfully`
    }

  } catch (error) {
    console.error(`Error sending ${templateName} email directly:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Trigger welcome workflow for new members
 */
export async function triggerWelcomeWorkflow(contactId: string) {
  return triggerWorkflow('new_member', contactId)
}

/**
 * Trigger birthday workflow for members
 */
export async function triggerBirthdayWorkflow(contactId: string) {
  return triggerWorkflow('birthday', contactId)
}

/**
 * Trigger visitor follow-up workflow
 */
export async function triggerVisitorFollowupWorkflow(contactId: string) {
  return triggerWorkflow('visitor_followup', contactId)
}

/**
 * Trigger event reminder workflow
 */
export async function triggerEventReminderWorkflow(contactId: string, eventId: string) {
  return triggerWorkflow('event_reminder', contactId, eventId)
} 