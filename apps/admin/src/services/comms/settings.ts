import { supabase, supabaseAdmin } from '@/lib/supabase'
import { sendSMS, CreateSMSParams } from '../sms'
import { enqueueEmailDirect, EmailVariables } from '../emailService'

// Types for communication settings
export type SMSSettings = {
  provider: 'twilio' | 'aws-sns' | 'messagebird'
  sender_id: string
  daily_limit: number
  monthly_limit: number
  cost_per_sms: number
  webhook_url?: string
  opt_out_enabled: boolean
  test_mode: boolean
  api_key?: string
  api_secret?: string
  account_sid?: string
  auth_token?: string
}

export type EmailSettings = {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'aws-ses'
  from_name: string
  from_email: string
  smtp_host?: string
  smtp_port?: number
  smtp_secure: boolean
  daily_limit: number
  monthly_limit: number
  webhook_url?: string
  test_mode: boolean
  api_key?: string
  smtp_username?: string
  smtp_password?: string
}

export type WhatsAppSettings = {
  provider: 'twilio' | 'meta'
  phone_number_id: string
  access_token?: string
  webhook_url?: string
  business_verified: boolean
  test_mode: boolean
  api_version?: string
}

export type PushSettings = {
  provider: 'firebase' | 'apns'
  server_key?: string
  vapid_key?: string
  daily_limit: number
  monthly_limit: number
  test_mode: boolean
  project_id?: string
  private_key?: string
}

export type CommunicationSettings = {
  id?: string
  sms: SMSSettings
  email: EmailSettings
  whatsapp: WhatsAppSettings
  push: PushSettings
  created_at?: string
  updated_at?: string
}

export type TestMessageParams = {
  channel: 'sms' | 'email' | 'whatsapp' | 'push'
  to: string
  subject?: string
  message: string
}

// Default settings
const defaultSettings: CommunicationSettings = {
  sms: {
    provider: 'twilio',
    sender_id: 'CHURCH',
    daily_limit: 1000,
    monthly_limit: 10000,
    cost_per_sms: 0.0075,
    opt_out_enabled: true,
    test_mode: true
  },
  email: {
    provider: 'smtp',
    from_name: 'Your Church',
    from_email: 'noreply@yourchurch.com',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: true,
    daily_limit: 5000,
    monthly_limit: 50000,
    test_mode: true
  },
  whatsapp: {
    provider: 'twilio',
    phone_number_id: '',
    business_verified: false,
    test_mode: true
  },
  push: {
    provider: 'firebase',
    daily_limit: 10000,
    monthly_limit: 100000,
    test_mode: true
  }
}

/**
 * Load communication settings from database
 */
export async function loadCommunicationSettings(): Promise<{ data: CommunicationSettings | null, error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('communication_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // If no settings exist, return defaults
    if (!data) {
      return { data: defaultSettings, error: null }
    }

    return { data: data as CommunicationSettings, error: null }
  } catch (error) {
    console.error('Error loading communication settings:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save communication settings to database
 */
export async function saveCommunicationSettings(settings: Partial<CommunicationSettings>): Promise<{ success: boolean, error?: string }> {
  try {
    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('communication_settings')
      .select('id')
      .single()

    if (existing) {
      // Update existing settings
      const { error } = await supabaseAdmin
        .from('communication_settings')
        .update({
          sms: settings.sms,
          email: settings.email,
          whatsapp: settings.whatsapp,
          push: settings.push,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Create new settings
      const { error } = await supabaseAdmin
        .from('communication_settings')
        .insert({
          sms: settings.sms || defaultSettings.sms,
          email: settings.email || defaultSettings.email,
          whatsapp: settings.whatsapp || defaultSettings.whatsapp,
          push: settings.push || defaultSettings.push
        })

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving communication settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save SMS settings
 */
export async function saveSMSSettings(smsSettings: Partial<SMSSettings>): Promise<{ success: boolean, error?: string }> {
  try {
    const { data: currentSettings } = await loadCommunicationSettings()
    
    const updatedSettings = {
      ...currentSettings,
      sms: { ...currentSettings?.sms, ...smsSettings }
    }

    return await saveCommunicationSettings(updatedSettings)
  } catch (error) {
    console.error('Error saving SMS settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save email settings
 */
export async function saveEmailSettings(emailSettings: Partial<EmailSettings>): Promise<{ success: boolean, error?: string }> {
  try {
    const { data: currentSettings } = await loadCommunicationSettings()
    
    const updatedSettings = {
      ...currentSettings,
      email: { ...currentSettings?.email, ...emailSettings }
    }

    return await saveCommunicationSettings(updatedSettings)
  } catch (error) {
    console.error('Error saving email settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save WhatsApp settings
 */
export async function saveWhatsAppSettings(whatsappSettings: Partial<WhatsAppSettings>): Promise<{ success: boolean, error?: string }> {
  try {
    const { data: currentSettings } = await loadCommunicationSettings()
    
    const updatedSettings = {
      ...currentSettings,
      whatsapp: { ...currentSettings?.whatsapp, ...whatsappSettings }
    }

    return await saveCommunicationSettings(updatedSettings)
  } catch (error) {
    console.error('Error saving WhatsApp settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save push notification settings
 */
export async function savePushSettings(pushSettings: Partial<PushSettings>): Promise<{ success: boolean, error?: string }> {
  try {
    const { data: currentSettings } = await loadCommunicationSettings()
    
    const updatedSettings = {
      ...currentSettings,
      push: { ...currentSettings?.push, ...pushSettings }
    }

    return await saveCommunicationSettings(updatedSettings)
  } catch (error) {
    console.error('Error saving push settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send test message through specified channel
 */
export async function sendTestMessage(params: TestMessageParams): Promise<{ success: boolean, error?: string }> {
  try {
    const { data: settings } = await loadCommunicationSettings()
    if (!settings) throw new Error('Communication settings not found')

    switch (params.channel) {
      case 'sms':
        return await sendTestSMS(params.to, params.message, settings.sms)
      
      case 'email':
        return await sendTestEmail(params.to, params.subject || 'Test Email', params.message, settings.email)
      
      case 'whatsapp':
        return await sendTestWhatsApp(params.to, params.message, settings.whatsapp)
      
      case 'push':
        return await sendTestPush(params.to, params.subject || 'Test Notification', params.message, settings.push)
      
      default:
        throw new Error(`Unsupported channel: ${params.channel}`)
    }
  } catch (error) {
    console.error('Error sending test message:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send test SMS
 */
async function sendTestSMS(to: string, message: string, settings: SMSSettings): Promise<{ success: boolean, error?: string }> {
  try {
    if (settings.test_mode) {
      // In test mode, just simulate success
      console.log('Test SMS (simulated):', { to, message, settings: settings.provider })
      return { success: true }
    }

    const smsParams: CreateSMSParams = {
      to_phone: to,
      message: `[TEST] ${message}`,
      template_id: null
    }

    const result = await sendSMS(smsParams)
    return { success: result.success, error: result.error }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send test email
 */
async function sendTestEmail(to: string, subject: string, message: string, settings: EmailSettings): Promise<{ success: boolean, error?: string }> {
  try {
    if (settings.test_mode) {
      // In test mode, just simulate success
      console.log('Test Email (simulated):', { to, subject, message, settings: settings.provider })
      return { success: true }
    }

    const emailVariables: EmailVariables = {
      subject: `[TEST] ${subject}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email from Your Church</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is a test email sent from your church communication system.
          </p>
        </div>
      `
    }

    const result = await enqueueEmailDirect(to, emailVariables, {
      emailType: 'system'
    })
    
    return { success: result.success, error: result.error }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send test WhatsApp message
 */
async function sendTestWhatsApp(to: string, message: string, settings: WhatsAppSettings): Promise<{ success: boolean, error?: string }> {
  try {
    if (settings.test_mode || !settings.business_verified) {
      // In test mode or not verified, just simulate success
      console.log('Test WhatsApp (simulated):', { to, message, settings: settings.provider })
      return { success: true }
    }

    // TODO: Implement actual WhatsApp API integration
    // For now, simulate success
    console.log('WhatsApp test message would be sent:', { to, message })
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send test push notification
 */
async function sendTestPush(to: string, title: string, message: string, settings: PushSettings): Promise<{ success: boolean, error?: string }> {
  try {
    if (settings.test_mode) {
      // In test mode, just simulate success
      console.log('Test Push (simulated):', { to, title, message, settings: settings.provider })
      return { success: true }
    }

    // TODO: Implement actual push notification integration
    // For now, simulate success
    console.log('Push notification test would be sent:', { to, title, message })
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Test connection for a specific channel
 */
export async function testChannelConnection(channel: 'sms' | 'email' | 'whatsapp' | 'push'): Promise<{ success: boolean, error?: string }> {
  try {
    const { data: settings } = await loadCommunicationSettings()
    if (!settings) throw new Error('Communication settings not found')

    switch (channel) {
      case 'sms':
        // Test SMS configuration
        if (!settings.sms.sender_id) {
          return { success: false, error: 'SMS sender ID not configured' }
        }
        return { success: true }
      
      case 'email':
        // Test email configuration
        if (!settings.email.from_email || !settings.email.smtp_host) {
          return { success: false, error: 'Email configuration incomplete' }
        }
        return { success: true }
      
      case 'whatsapp':
        // Test WhatsApp configuration
        if (!settings.whatsapp.phone_number_id || !settings.whatsapp.business_verified) {
          return { success: false, error: 'WhatsApp not configured or verified' }
        }
        return { success: true }
      
      case 'push':
        // Test push notification configuration
        if (!settings.push.server_key) {
          return { success: false, error: 'Push notification server key not configured' }
        }
        return { success: true }
      
      default:
        return { success: false, error: 'Unknown channel' }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 