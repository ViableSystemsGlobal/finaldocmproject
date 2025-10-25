import { supabase, supabaseAdmin } from '@/lib/supabase'

export type SMSMessage = {
  id: string
  to_phone: string
  from_phone?: string
  message: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'queued'
  sent_at?: string | null
  delivered_at?: string | null
  failed_at?: string | null
  error_message?: string | null
  cost?: number
  external_id?: string
  template_id?: string | null
  variables?: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string | null
  // Joined data
  contact?: {
    id: string
    name: string
    email?: string
  }
}

export type SMSTemplate = {
  id: string
  name: string
  message: string
  variables?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  usage_count?: number
}

export type SMSCampaign = {
  id: string
  name: string
  template_id?: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduled_at?: string | null
  total_recipients?: number
  sent_count?: number
  delivered_count?: number
  failed_count?: number
  created_at: string
  updated_at: string
  created_by?: string | null
}

export type SMSMetrics = {
  totalMessages: number
  sentMessages: number
  deliveredMessages: number
  failedMessages: number
  pendingMessages: number
  deliveryRate: number
  totalCost: number
  monthlyMessages: number
  templateCount: number
  campaignCount: number
}

export type CreateSMSParams = {
  to_phone: string
  message: string
  template_id?: string | null
  variables?: Record<string, any>
  scheduled_at?: string | null
}

export type CreateSMSTemplateParams = {
  name: string
  message: string
  variables?: string[]
}

export type CreateSMSCampaignParams = {
  name: string
  template_id?: string | null
  scheduled_at?: string | null
}

/**
 * Fetch all SMS messages with optional filtering
 */
export async function fetchSMSMessages(filters?: {
  status?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = supabaseAdmin
      .from('sms_messages')
      .select(`
        *,
        contact:contacts(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 25)) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return { data: data as SMSMessage[] | null, error: null }
  } catch (error) {
    console.error('Error fetching SMS messages:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetch SMS message by ID
 */
export async function fetchSMSMessage(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('sms_messages')
      .select(`
        *,
        contact:contacts(id, name, email, phone)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return { data: data as SMSMessage | null, error: null }
  } catch (error) {
    console.error('Error fetching SMS message:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send a single SMS message
 */
export async function sendSMS(params: CreateSMSParams) {
  try {
    console.log('Starting SMS send with params:', {
      to_phone: params.to_phone,
      message: params.message?.substring(0, 50) + '...',
      template_id: params.template_id,
      has_variables: !!params.variables,
      scheduled_at: params.scheduled_at
    });

    // First, create the SMS record
    const smsData = {
      to_phone: params.to_phone,
      message: params.message,
      template_id: params.template_id,
      variables: params.variables,
      status: params.scheduled_at ? 'queued' : 'pending'
    }

    console.log('Inserting SMS record into database...');
    const { data: smsRecord, error: insertError } = await supabaseAdmin
      .from('sms_messages')
      .insert(smsData)
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to create SMS record: ${insertError.message}`);
    }

    console.log('SMS record created successfully:', smsRecord.id);

    // If not scheduled, send immediately
    if (!params.scheduled_at) {
      console.log('Sending SMS immediately...');
      const sendResult = await sendSMSToProvider(smsRecord);
      
      console.log('SMS send result:', sendResult);
      
      // Update the SMS record with the result
      const { error: updateError } = await supabaseAdmin
        .from('sms_messages')
        .update({
          status: sendResult.success ? 'sent' : 'failed',
          sent_at: sendResult.success ? new Date().toISOString() : null,
          error_message: sendResult.error || null,
          external_id: sendResult.external_id || null
        })
        .eq('id', smsRecord.id)

      if (updateError) {
        console.error('Error updating SMS record:', updateError);
        throw new Error(`Failed to update SMS record: ${updateError.message}`);
      }

      // Return the result based on send success
      if (!sendResult.success) {
        return { 
          success: false, 
          error: sendResult.error || 'SMS sending failed'
        };
      }
    }

    return { success: true, data: smsRecord }
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Better error handling
    if (error instanceof Error) {
      return { 
        success: false, 
        error: error.message 
      };
    } else if (typeof error === 'object' && error !== null) {
      // Handle Supabase errors or other objects
      const errorObj = error as any;
      return { 
        success: false, 
        error: errorObj.message || errorObj.error_description || JSON.stringify(error)
      };
    } else {
      return { 
        success: false, 
        error: 'Unknown error occurred while sending SMS' 
      };
    }
  }
}

/**
 * Fetch SMS templates
 */
export async function fetchSMSTemplates() {
  try {
    const { data, error } = await supabaseAdmin
      .from('sms_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return { data: data as SMSTemplate[] | null, error: null }
  } catch (error) {
    console.error('Error fetching SMS templates:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Create SMS template
 */
export async function createSMSTemplate(params: CreateSMSTemplateParams) {
  try {
    const { data, error } = await supabaseAdmin
      .from('sms_templates')
      .insert({
        name: params.name,
        message: params.message,
        variables: params.variables,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as SMSTemplate }
  } catch (error) {
    console.error('Error creating SMS template:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update SMS template
 */
export async function updateSMSTemplate(id: string, params: Partial<CreateSMSTemplateParams>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('sms_templates')
      .update(params)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as SMSTemplate }
  } catch (error) {
    console.error('Error updating SMS template:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete SMS template
 */
export async function deleteSMSTemplate(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('sms_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting SMS template:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get SMS metrics and analytics
 */
export async function getSMSMetrics(): Promise<{ data: SMSMetrics | null, error: any }> {
  try {
    // Get message counts by status
    const { data: messageCounts, error: countsError } = await supabaseAdmin
      .rpc('get_sms_metrics')

    if (countsError) throw countsError

    // Get template count
    const { count: templateCount, error: templateError } = await supabaseAdmin
      .from('sms_templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (templateError) throw templateError

    // Get this month's message count
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: monthlyMessages, error: monthlyError } = await supabaseAdmin
      .from('sms_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    if (monthlyError) throw monthlyError

    const metrics: SMSMetrics = {
      totalMessages: messageCounts?.total_messages || 0,
      sentMessages: messageCounts?.sent_messages || 0,
      deliveredMessages: messageCounts?.delivered_messages || 0,
      failedMessages: messageCounts?.failed_messages || 0,
      pendingMessages: messageCounts?.pending_messages || 0,
      deliveryRate: messageCounts?.delivery_rate || 0,
      totalCost: messageCounts?.total_cost || 0,
      monthlyMessages: monthlyMessages || 0,
      templateCount: templateCount || 0,
      campaignCount: 0 // Will be implemented when SMS campaigns are added
    }

    return { data: metrics, error: null }
  } catch (error) {
    console.error('Error fetching SMS metrics:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send SMS via Twilio or other provider
 */
async function sendSMSToProvider(smsRecord: any) {
  try {
    console.log('Getting SMS provider settings...');
    
    // First, try to get settings from communication_settings table
    let smsSettings = null;
    const { data: commSettings, error: commError } = await supabaseAdmin
      .from('communication_settings')
      .select('sms')
      .single();

    if (commSettings?.sms && commSettings.sms.api_key && commSettings.sms.api_secret && commSettings.sms.account_sid) {
      console.log('Using communication_settings for SMS provider');
      smsSettings = commSettings.sms;
    } else {
      console.log('Communication settings incomplete, checking integration_settings...');
      
      // Fallback to integration_settings table
      const { data: intSettings, error: intError } = await supabaseAdmin
        .from('integration_settings')
        .select('config')
        .eq('provider', 'twilio')
        .eq('is_active', true)
        .single();

      if (intSettings?.config) {
        console.log('Using integration_settings for SMS provider');
        // Map integration settings to expected format
        smsSettings = {
          provider: 'twilio',
          account_sid: intSettings.config.account_sid,
          api_key: intSettings.config.auth_token, // Twilio uses auth_token
          api_secret: intSettings.config.auth_token, // Same as api_key for Twilio
          sender_id: intSettings.config.phone_number,
          test_mode: intSettings.config.test_mode !== false, // Default to true
        };
      }
    }

    if (!smsSettings) {
      console.error('No SMS settings found in either table');
      return {
        success: false,
        error: 'SMS provider not configured. Please configure Twilio in Settings > Integrations or Communications Settings.'
      };
    }

    if (!smsSettings.api_key || !smsSettings.api_secret || !smsSettings.account_sid) {
      console.error('SMS settings incomplete:', {
        has_api_key: !!smsSettings.api_key,
        has_api_secret: !!smsSettings.api_secret,
        has_account_sid: !!smsSettings.account_sid,
      });
      return {
        success: false,
        error: 'SMS provider not configured properly. Please check your Twilio settings.'
      };
    }

    console.log('SMS settings loaded successfully, test_mode:', smsSettings.test_mode);

    // If in test mode, simulate the send
    if (smsSettings.test_mode) {
      console.log('SMS test mode - simulating send to:', smsRecord.to_phone);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        external_id: `test_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    // Real Twilio integration
    if (smsSettings.provider === 'twilio') {
      try {
        console.log('Sending SMS via Twilio API...');
        
        const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${smsSettings.account_sid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${smsSettings.account_sid}:${smsSettings.api_secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: smsRecord.to_phone,
            From: smsSettings.sender_id,
            Body: smsRecord.message,
          }).toString(),
        });

        if (!twilioResponse.ok) {
          const errorData = await twilioResponse.text();
          console.error('Twilio API error:', errorData);
          return {
            success: false,
            error: `Twilio API error: ${twilioResponse.status} ${twilioResponse.statusText}`
          };
        }

        const twilioData = await twilioResponse.json();
        console.log('SMS sent successfully via Twilio:', twilioData.sid);

        return {
          success: true,
          external_id: twilioData.sid
        };
      } catch (error) {
        console.error('Error calling Twilio API:', error);
        return {
          success: false,
          error: `Twilio integration error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    // Fallback for other providers
    return {
      success: false,
      error: `Unsupported SMS provider: ${smsSettings.provider}`
    };

  } catch (error) {
    console.error('Error in sendSMSToProvider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMS(params: {
  template_id?: string
  message?: string
  recipients: Array<{ phone: string; variables?: Record<string, any> }>
  scheduled_at?: string
}) {
  try {
    const results = []
    
    for (const recipient of params.recipients) {
      const smsParams: CreateSMSParams = {
        to_phone: recipient.phone,
        message: params.message || '',
        template_id: params.template_id,
        variables: recipient.variables,
        scheduled_at: params.scheduled_at
      }
      
      const result = await sendSMS(smsParams)
      results.push(result)
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    return {
      success: true,
      data: {
        total: params.recipients.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    }
  } catch (error) {
    console.error('Error sending bulk SMS:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 