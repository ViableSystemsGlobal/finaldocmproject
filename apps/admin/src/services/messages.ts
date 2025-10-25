import { supabase } from '@/lib/supabase'
import { sendEmail, EmailVariables } from './emailService'

export type MessageChannel = 'email' | 'sms' | 'whatsapp' | 'push'
export type MessageStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled'

export interface Message {
  id: string
  channel: MessageChannel
  content: string
  subject?: string
  group_type: 'group' | 'discipleship_group'
  group_id: string
  recipient_ids: string[]
  status: MessageStatus
  sent_count: number
  error_message?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  subject?: string
  channel: MessageChannel
  type: string
  variables?: string[]
  created_at: string
  updated_at: string
}

export interface GroupMessageRequest {
  groupId: string
  channel: MessageChannel
  content: string
  subject?: string
  recipientIds: string[]
}

export interface MessageResult {
  success: boolean
  messageId?: string
  successfulSends: number
  errors: number
  error?: string
}

/**
 * Fetch message templates
 */
export async function fetchMessageTemplates(
  channel: MessageChannel,
  type: string = 'group'
): Promise<{ data: MessageTemplate[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('comms.templates')
      .select('*')
      .eq('channel', channel)
      .eq('type', type)
      .order('name')

    return { data: data as MessageTemplate[], error }
  } catch (err) {
    console.error('Error fetching message templates:', err)
    return { data: null, error: err }
  }
}

/**
 * Process template variables
 */
export function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    processed = processed.replace(regex, String(value))
  })
  
  return processed
}

/**
 * Send message to discipleship group using database function
 */
export async function sendDiscipleshipGroupMessage(request: GroupMessageRequest): Promise<MessageResult> {
  try {
    console.log('Sending discipleship group message:', request)

    // Fetch group name for template processing  
    const { data: group, error: groupError } = await supabase
      .from('discipleship_groups')
      .select('name')
      .eq('id', request.groupId)
      .single()

    if (groupError) {
      console.warn('Could not fetch group name:', groupError)
    }

    const groupName = group?.name || 'Discipleship Group'

    // Process group_name template variable in content and subject before sending
    let processedContent = request.content.replace(/\{\{\s*group_name\s*\}\}/g, groupName)
    let processedSubject = request.subject?.replace(/\{\{\s*group_name\s*\}\}/g, groupName) || `Message from ${groupName}`

    const { data, error } = await supabase.rpc('send_discipleship_group_message', {
      p_channel: request.channel,
      p_content: processedContent,
      p_group_id: request.groupId,
      p_recipient_ids: request.recipientIds,
      p_subject: processedSubject
    })

    if (error) {
      console.error('Database function error:', error)
      throw error
    }

    console.log('Database function result:', data)

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to send message')
    }

    return {
      success: true,
      messageId: data.message_id,
      successfulSends: data.successful || 0,
      errors: data.errors || 0
    }
  } catch (err) {
    console.error('Error in sendDiscipleshipGroupMessage:', err)
    return {
      success: false,
      successfulSends: 0,
      errors: 1,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Enhanced group messaging with proper email templates and token replacement
 */
export async function sendDiscipleshipGroupMessageDirect(request: GroupMessageRequest): Promise<MessageResult> {
  console.log('📧 Sending group message with proper email templating...')
  
  try {
    // Try to detect group type and fetch group name
    let groupName = 'Group'
    let groupType = 'group'
    
    // First try discipleship_groups table
    const { data: discipleshipGroup, error: discipleshipError } = await supabase
      .from('discipleship_groups')
      .select('name, description')
      .eq('id', request.groupId)
      .single()

    if (discipleshipGroup) {
      groupName = discipleshipGroup.name
      groupType = 'discipleship_group'
      console.log('✅ Found discipleship group:', groupName)
    } else {
      // Try regular groups table
      const { data: regularGroup, error: regularError } = await supabase
        .from('groups')
        .select('name, description')
        .eq('id', request.groupId)
        .single()

      if (regularGroup) {
        groupName = regularGroup.name
        groupType = 'group'
        console.log('✅ Found regular group:', groupName)
      } else {
        console.error('Could not fetch group from either table:')
        console.error('- Discipleship groups error:', discipleshipError)
        console.error('- Regular groups error:', regularError)
        throw new Error('Could not fetch group information from either discipleship_groups or groups table')
      }
    }

    // Get church settings for templating
    const { data: churchSettings, error: churchError } = await supabase
      .from('tenant_settings')
      .select('*')
      .single()

    if (churchError) {
      console.error('Error fetching church settings:', churchError)
      throw new Error('Could not fetch church settings')
    }

    const churchName = churchSettings.name || 'DOCM Church'

    // Try to get a group messaging template from comms_defaults
    const { data: template, error: templateError } = await supabase
      .from('comms_defaults')
      .select('*')
      .eq('template_name', 'group_message')
      .eq('channel', 'email')
      .single()

    // If no template found, create a default one
    let emailTemplate = template?.body || `
      <div style="color: #4a5568; font-size: 16px; line-height: 1.6;">
        <p>Hello {{ first_name }},</p>
        <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          {{ message_content }}
        </div>
        <p>This message was sent to members of {{ group_name }}.</p>
        <p>Blessings,<br>{{ church_name }}</p>
      </div>
    `

    // Get recipient contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .in('id', request.recipientIds)

    if (contactsError) {
      throw contactsError
    }

    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        successfulSends: 0,
        errors: 1,
        error: 'No valid contacts found'
      }
    }

    let successCount = 0
    let errorCount = 0

    // Send emails using proper templating
    for (const contact of contacts) {
      if (!contact.email) {
        console.warn(`No email for contact ${contact.id}`)
        errorCount++
        continue
      }

      try {
        // Create template variables
        const templateVariables = {
          first_name: contact.first_name || 'Friend',
          last_name: contact.last_name || '',
          full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
          group_name: groupName,
          church_name: churchName,
          message_content: request.content
        }

        // Process template content
        let processedContent = emailTemplate
        let processedSubject = request.subject || template?.subject || `Message from ${groupName}`

        // Replace template variables using the same approach as the rest of the system
        Object.entries(templateVariables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
          processedContent = processedContent.replace(regex, String(value))
          processedSubject = processedSubject.replace(regex, String(value))
        })

        // Create the proper HTML email template with church branding
        const htmlEmail = createEmailTemplate(
          processedSubject,
          processedContent,
          contact.first_name || 'Friend'
        )

        // Send email using the proper email service
        const result = await sendEmail(contact.email, {
          subject: processedSubject,
          body: htmlEmail,
          plainText: processedContent.replace(/<[^>]*>/g, '')
        }, {
          emailType: 'system',
          metadata: {
            contact_id: contact.id,
            group_id: request.groupId,
            group_type: groupType,
            group_name: groupName,
            message_type: 'group_message'
          }
        })

        if (result.success) {
          successCount++
          console.log(`✅ Email sent successfully to ${contact.email}`)
        } else {
          errorCount++
          console.error(`❌ Failed to send email to ${contact.email}:`, result.error)
        }

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (err) {
        errorCount++
        console.error(`❌ Error sending to ${contact.email}:`, err)
      }
    }

    // Store message record in database
    try {
      // Create the table if it doesn't exist (simple approach)
      try {
        await supabase.rpc('exec_sql', { 
          sql: `
            CREATE SCHEMA IF NOT EXISTS comms;
            CREATE TABLE IF NOT EXISTS comms.messages (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              channel TEXT NOT NULL,
              content TEXT NOT NULL,
              subject TEXT,
              group_type TEXT NOT NULL,
              group_id UUID NOT NULL,
              recipient_ids UUID[] NOT NULL,
              status TEXT NOT NULL DEFAULT 'pending',
              sent_count INTEGER DEFAULT 0,
              error_message TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              created_by UUID REFERENCES auth.users(id)
            );
          ` 
        })
      } catch (createError) {
        // Table might already exist, ignore error
        console.log('Table creation skipped (might already exist)')
      }

      const { error: insertError } = await supabase
        .from('comms.messages')
        .insert({
          channel: request.channel,
          content: request.content,
          subject: request.subject,
          group_type: groupType,
          group_id: request.groupId,
          recipient_ids: request.recipientIds,
          status: successCount > 0 ? 'sent' : 'failed',
          sent_count: successCount,
          error_message: errorCount > 0 ? `${errorCount} recipients failed` : null
        })

      if (insertError) {
        console.error('Failed to store message record:', insertError)
      } else {
        console.log('✅ Message record stored successfully')
      }
    } catch (err) {
      console.error('Error storing message record:', err)
    }

    return {
      success: successCount > 0,
      successfulSends: successCount,
      errors: errorCount,
      messageId: crypto.randomUUID()
    }

  } catch (err) {
    console.error('❌ Error in sendDiscipleshipGroupMessageDirect:', err)
    return {
      success: false,
      successfulSends: 0,
      errors: 1,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Create proper HTML email template with church branding
 */
function createEmailTemplate(subject: string, content: string, recipientName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
            DOCM CHURCH
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">
            Demonstration of Christ Ministries
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hello ${recipientName}!
          </h2>
          
          <div style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            ${content}
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 0;">
              We hope to see you soon at DOCM Church!
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #edf2f7; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px; margin: 0 0 10px 0;">
            This message was sent from the DOCM Church Management System.
          </p>
          <p style="color: #a0aec0; font-size: 11px; margin: 0;">
            If you have any questions, please contact our church office.
          </p>
          <div style="margin-top: 20px;">
            <p style="color: #a0aec0; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} Demonstration of Christ Ministries
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Main function to send messages to discipleship groups
 * Currently uses direct approach since database function has foreign key issues
 */
export async function sendGroupMessage(request: GroupMessageRequest): Promise<MessageResult> {
  // Use direct approach since database has foreign key constraint issues
  console.log('Using direct messaging approach for discipleship groups...')
  return sendDiscipleshipGroupMessageDirect(request)
}

/**
 * Alias for direct approach (for explicit usage)
 */
export const sendGroupMessageDirect = sendDiscipleshipGroupMessageDirect

// Fetch message history for a group
export async function fetchGroupMessages(groupId: string) {
  try {
    const { data, error } = await supabase
      .from('comms.messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data as Message[], error: null }
  } catch (error) {
    console.error('Error fetching group messages:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch messages' 
    }
  }
}

// Get message statistics for a group
export async function getGroupMessageStats(groupId: string) {
  try {
    const { data: messages, error } = await fetchGroupMessages(groupId)
    
    if (error) throw error
    
    const stats = {
      total: messages?.length || 0,
      sent: 0,
      failed: 0,
      pending: 0,
      totalRecipients: 0
    }
    
    messages?.forEach(message => {
      stats.totalRecipients += message.sent_count || 0
      
      switch (message.status) {
        case 'sent':
          stats.sent++
          break
        case 'failed':
          stats.failed++
          break
        case 'pending':
        case 'sending':
          stats.pending++
          break
      }
    })
    
    return { data: stats, error: null }
  } catch (error) {
    console.error('Error getting message stats:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get stats' 
    }
  }
} 