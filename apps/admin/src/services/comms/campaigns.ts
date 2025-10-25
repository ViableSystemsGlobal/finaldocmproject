import { supabase } from '@/lib/supabase';
import { CommsTemplate } from './templates'
import { supabaseAdmin } from '@/lib/supabase';
import { EmailVariables, sendEmail } from '../emailService';
import { sendSMS } from '../sms';

export type CommsCampaign = {
  id: string
  template_id: string
  name: string
  channel: 'email' | 'sms' | 'whatsapp' | 'push'
  scheduled_at: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'completed'
  created_by: string
  created_at: string
  updated_at: string
  // Join data
  template?: CommsTemplate
}

export type CampaignMetrics = {
  total_recipients: number
  pending_count: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  failed_count: number
}

export type GlobalCommsMetrics = {
  total_campaigns: number
  active_campaigns: number
  scheduled_campaigns: number
  completed_campaigns: number
  total_templates: number
  email_templates: number
  sms_templates: number
  whatsapp_templates: number
  push_templates: number
}

export type CreateCampaignParams = {
  template_id: string
  name: string
  channel: CommsCampaign['channel']
  scheduled_at?: string | null
}

export type UpdateCampaignParams = Partial<CreateCampaignParams> & {
  status?: CommsCampaign['status']
}

/**
 * Types for campaign-related data
 */
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  schedule_time?: string | null;
  created_at: string;
  updated_at: string;
  sender_id?: string | null;
  template_id?: string | null;
  recipient_count?: number;
  sent_count?: number;
  variables?: Record<string, any>;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  to_address: string;
  variables?: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

/**
 * Get recipient count for a campaign
 */
export async function getCampaignRecipientCount(campaignId: string) {
  try {
    console.log('Getting recipient count for campaign:', campaignId);
    
    const { count, error } = await supabaseAdmin
      .from('comms_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
    
    if (error) {
      console.error('Database error when getting recipient count:', error);
      throw error;
    }
    
    console.log(`Campaign ${campaignId} has ${count || 0} recipients`);
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error getting campaign recipient count:', error);
    return { 
      success: false, 
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Fetch all communication campaigns
 */
export async function fetchCampaigns() {
  const { data, error } = await supabaseAdmin
    .from('comms_campaigns')
    .select(`
      *,
      template:comms_templates(*)
    `)
    .order('updated_at', { ascending: false })
  
  return { data: data as CommsCampaign[] | null, error }
}

/**
 * Fetch campaigns by status
 */
export async function fetchCampaignsByStatus(status: string) {
  const { data, error } = await supabaseAdmin
    .from('comms_campaigns')
    .select(`
      *,
      template:comms_templates(*)
    `)
    .eq('status', status)
    .order('updated_at', { ascending: false })
  
  return { data: data as CommsCampaign[] | null, error }
}

/**
 * Fetch a single campaign by ID
 */
export async function fetchCampaign(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('comms_campaigns')
      .select(`
        *,
        template:comms_templates(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create a new communication campaign in the unified comms_campaigns table
 */
export async function createCommsCampaign(campaignData: CreateCampaignParams) {
  try {
    console.log('Creating comms campaign with data:', campaignData);

    const { data: result, error } = await supabaseAdmin
      .from('comms_campaigns')
      .insert({
        name: campaignData.name,
        channel: campaignData.channel,
        template_id: campaignData.template_id,
        scheduled_at: campaignData.scheduled_at,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating comms campaign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create a new communication campaign
 */
export async function createCampaign(campaignData: Partial<Campaign>) {
  try {
    // Add default values for required fields
    const data = {
      name: campaignData.name || 'Untitled Campaign',
      subject: campaignData.subject || 'No Subject',
      body: campaignData.body || '<p>Campaign content</p>',
      status: campaignData.status || 'draft',
      scheduled_at: campaignData.schedule_time,
      template_id: campaignData.template_id,
      variables: campaignData.variables
    };

    console.log('Creating campaign with data:', data);

    const { data: result, error } = await supabaseAdmin
      .from('comms_campaigns')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating campaign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(id: string, campaignData: Partial<Campaign>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('comms_campaigns')
      .update(campaignData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating campaign:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string) {
  const { error } = await supabaseAdmin
    .from('comms_campaigns')
    .delete()
    .eq('id', id)
  
  return { success: !error, error }
}

/**
 * Schedule a campaign for sending
 */
export async function scheduleCampaign(id: string, scheduledAt?: string) {
  const params: UpdateCampaignParams = {
    status: 'scheduled',
  }
  
  if (scheduledAt) {
    params.scheduled_at = scheduledAt
  }
  
  const { data, error } = await supabaseAdmin
    .from('comms_campaigns')
    .update({ 
      status: 'scheduled',
      scheduled_at: scheduledAt
    })
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as Campaign | null, error }
}

/**
 * Cancel a scheduled campaign
 */
export async function cancelCampaign(id: string) {
  const { data, error } = await supabaseAdmin
    .from('comms_campaigns')
    .update({ status: 'draft', scheduled_at: null })
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as Campaign | null, error }
}

/**
 * Get metrics for a specific campaign
 */
export async function getCampaignMetrics(campaignId: string): Promise<{ data: CampaignMetrics | null, error: any }> {
  const { data, error } = await supabaseAdmin
    .rpc('get_comms_campaign_metrics', { campaign_id: campaignId })
    .single()
  
  return { data: data as CampaignMetrics | null, error }
}

/**
 * Get global communications metrics
 */
export async function getCommsMetrics(): Promise<{ data: GlobalCommsMetrics | null, error: any }> {
  const { data, error } = await supabaseAdmin
    .rpc('get_comms_metrics')
    .single()
  
  return { data: data as GlobalCommsMetrics | null, error }
}

/**
 * Send a campaign immediately
 */
export async function sendCampaignNow(id: string) {
  console.log('Starting send campaign process for:', id);
  
  // First update the campaign status to 'sending'
  const { data, error } = await supabaseAdmin
    .from('comms_campaigns')
    .update({ status: 'sending', scheduled_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating campaign status:', error);
    return { success: false, error }
  }
  
  // Just dispatch the campaign directly - no Edge Function
  try {
    console.log('Dispatching campaign:', id);
    const result = await dispatchCampaign(id);
    
    if (!result.success) {
      console.error('Error dispatching campaign:', 'error' in result ? result.error : 'Unknown error');
      return { success: false, error: 'error' in result ? result.error : 'Unknown error' };
    }
    
    console.log('Campaign sent successfully!');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending campaign:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Fetch recipients for a campaign
 */
export async function fetchCampaignRecipients(campaignId: string) {
  try {
    console.log('Fetching campaign recipients for campaign:', campaignId);
    
    const { data, error } = await supabaseAdmin
      .from('comms_recipients')
      .select('*, contact:contact_id(first_name, last_name, email)')
      .eq('campaign_id', campaignId);
    
    if (error) {
      console.error('Database error when fetching recipients:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} recipients`);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching campaign recipients:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Add recipients to a campaign
 */
export async function addCampaignRecipients(
  campaignId: string, 
  recipients: Array<{ contact_id: string; to_address: string; variables?: Record<string, any> }>
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('comms_recipients')
      .insert(
        recipients.map(recipient => ({
          campaign_id: campaignId,
          contact_id: recipient.contact_id,
          to_address: recipient.to_address,
          variables: recipient.variables || {},
          status: 'pending'
        }))
      )
      .select();
    
    if (error) throw error;
    
    // Update the recipient count on the campaign
    await supabaseAdmin
      .from('comms_campaigns')
      .update({ recipient_count: recipients.length })
      .eq('id', campaignId);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error adding campaign recipients:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Dispatch a campaign to all recipients (supports all channels)
 */
export async function dispatchCampaign(campaignId: string) {
  try {
    console.log('Starting campaign dispatch for:', campaignId);
    
    // 1. Fetch campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('comms_campaigns')
      .select(`
        *,
        template:comms_templates(*)
      `)
      .eq('id', campaignId)
      .single();
    
    if (campaignError) {
      console.error('Error fetching campaign details:', campaignError);
      throw campaignError;
    }
    
    console.log('Campaign details:', campaign);
    
    // 2. Update campaign status to sending
    await supabaseAdmin
      .from('comms_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaignId);
    
    // 3. Fetch all recipients
    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from('comms_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    
    if (recipientsError) {
      console.error('Error fetching campaign recipients:', recipientsError);
      throw recipientsError;
    }
    
    console.log(`Found ${recipients?.length || 0} pending recipients`);
    
    if (!recipients || recipients.length === 0) {
      console.log('No pending recipients found, marking campaign as completed');
      await supabaseAdmin
        .from('comms_campaigns')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', campaignId);
      
      return { success: true, message: 'No pending recipients found' };
    }
    
    // 4. Route to appropriate dispatch method based on channel
    let result;
    if (campaign.channel === 'sms') {
      result = await dispatchSMSCampaign(campaignId, campaign, recipients);
    } else if (campaign.channel === 'email') {
      result = await dispatchEmailCampaign(campaignId, campaign, recipients);
    } else if (campaign.channel === 'push') {
      result = await dispatchPushCampaign(campaignId, campaign, recipients);
    } else {
      throw new Error(`Unsupported campaign channel: ${campaign.channel}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error dispatching campaign:', error);
    
    // Update campaign status to failed
    try {
      await supabaseAdmin
        .from('comms_campaigns')
        .update({ 
          status: 'failed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', campaignId);
    } catch (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Dispatch SMS campaign
 */
async function dispatchSMSCampaign(campaignId: string, campaign: any, recipients: any[]) {
  console.log('Dispatching SMS campaign...');
  const results = [];
  
  for (const recipient of recipients) {
    try {
      // Process template variables
      let message = campaign.template?.body || '';
      
      // Merge all variables
      const allVariables = {
        ...campaign.variables,
        ...recipient.variables,
      };
      
      console.log(`Processing SMS variables for ${recipient.to_address}:`, allVariables);
      
      // Replace variables in message
      Object.entries(allVariables).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        message = message.replace(placeholder, String(value));
      });
      
      // Also handle common variable names with different cases
      const normalizedVars = {
        name: allVariables.full_name || allVariables.name || `${allVariables.first_name || ''} ${allVariables.last_name || ''}`.trim(),
        Name: allVariables.full_name || allVariables.name || `${allVariables.first_name || ''} ${allVariables.last_name || ''}`.trim(),
        first_name: allVariables.first_name || '',
        last_name: allVariables.last_name || '',
        phone: allVariables.phone || '',
      };
      
      Object.entries(normalizedVars).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        message = message.replace(placeholder, String(value));
      });
      
      console.log(`Final processed SMS for ${recipient.to_address}:`, message.substring(0, 50) + '...');
      
      console.log(`Sending SMS to ${recipient.to_address}: ${message.substring(0, 50)}...`);
      
      // Send SMS using your SMS service
      const smsResult = await sendSMS({
        to_phone: recipient.to_address,
        message: message,
        template_id: campaign.template_id,
        variables: recipient.variables
      });
      
      // Update recipient status
      await supabaseAdmin
        .from('comms_recipients')
        .update({ 
          status: smsResult.success ? 'sent' : 'failed', 
          updated_at: new Date().toISOString(),
          ...(smsResult.success ? { sent_at: new Date().toISOString() } : {})
        })
        .eq('id', recipient.id);
      
      results.push({ 
        id: recipient.id, 
        success: smsResult.success, 
        error: smsResult.success ? null : smsResult.error
      });
      
      // Small delay between SMS sends
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error sending SMS to ${recipient.id}:`, error);
      
      // Update recipient status
      await supabaseAdmin
        .from('comms_recipients')
        .update({ 
          status: 'failed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', recipient.id);
      
      results.push({ 
        id: recipient.id, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  // Calculate success metrics
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`SMS Campaign results: ${successful} sent, ${failed} failed`);
  
  // Update campaign status - ensure completed status is set properly
  let newStatus: 'completed' | 'failed' | 'sending' = 'sending';
  
  if (failed === results.length && results.length > 0) {
    // All failed
    newStatus = 'failed';
  } else if (successful > 0 && (successful + failed) === results.length) {
    // All processed (some or all successful)
    newStatus = 'completed';
  } else {
    // Still in progress
    newStatus = 'sending';
  }
  
  console.log(`Updating SMS campaign ${campaignId} status to: ${newStatus} (sent: ${successful}, failed: ${failed}, total: ${results.length})`);
  
  const { error: statusError } = await supabaseAdmin
    .from('comms_campaigns')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString() 
    })
    .eq('id', campaignId);
    
  if (statusError) {
    console.error('Error updating SMS campaign status:', statusError);
  } else {
    console.log(`✅ SMS Campaign ${campaignId} status updated to: ${newStatus}`);
  }
  
  return { 
    success: true, 
    total: results.length,
    sent: successful,
    failed
  };
}

/**
 * Dispatch Email campaign (existing logic extracted)
 */
async function dispatchEmailCampaign(campaignId: string, campaign: any, recipients: any[]) {
  console.log('Dispatching email campaign...');
  const results = [];
  
  // Process recipients sequentially to reduce CORS errors
  for (const recipient of recipients) {
    try {
      // Get the original template content
      let subject = campaign.template?.subject || 'No Subject';
      let body = campaign.template?.body || '<p>No content</p>';
      
      // Merge all variables
      const allVariables = {
        ...campaign.variables,
        ...recipient.variables,
      };
      
      console.log(`Processing variables for ${recipient.to_address}:`, allVariables);
      
      // Replace variables in subject and body
      Object.entries(allVariables).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        subject = subject.replace(placeholder, String(value));
        body = body.replace(placeholder, String(value));
      });
      
      // Also handle common variable names with different cases
      const normalizedVars = {
        name: allVariables.full_name || allVariables.name || `${allVariables.first_name || ''} ${allVariables.last_name || ''}`.trim(),
        Name: allVariables.full_name || allVariables.name || `${allVariables.first_name || ''} ${allVariables.last_name || ''}`.trim(),
        first_name: allVariables.first_name || '',
        last_name: allVariables.last_name || '',
        email: allVariables.email || '',
      };
      
      Object.entries(normalizedVars).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        subject = subject.replace(placeholder, String(value));
        body = body.replace(placeholder, String(value));
      });
      
      console.log(`Final processed content for ${recipient.to_address}:`, { subject, bodyPreview: body.substring(0, 100) + '...' });
      
      // Prepare email variables
      const emailVars: EmailVariables = {
        subject,
        body,
      };
      
      console.log(`Sending email to ${recipient.to_address}`);
      
      // Use the new unified email API
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient.to_address,
          subject: emailVars.subject,
          html: emailVars.body,
          emailType: 'bulk',
          priority: 'normal',
          metadata: {
            campaign_id: campaignId,
            recipient_id: recipient.id
          }
        })
      });
      
      const result = await response.json();
      
      // Small delay between sends
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update recipient status
      await supabaseAdmin
        .from('comms_recipients')
        .update({ 
          status: result.success ? 'sent' : 'failed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', recipient.id);
      
      results.push({ 
        id: recipient.id, 
        success: result.success, 
        error: result.success ? null : (result as any).error || 'Unknown error'
      });
      
    } catch (error) {
      console.error(`Error sending email to ${recipient.id}:`, error);
      
      // Update recipient status
      await supabaseAdmin
        .from('comms_recipients')
        .update({ 
          status: 'failed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', recipient.id);
      
      results.push({ 
        id: recipient.id, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  // Calculate success metrics
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Email Campaign results: ${successful} sent, ${failed} failed`);
  
  // Update campaign status - ensure completed status is set properly
  let newStatus: 'completed' | 'failed' | 'sending' = 'sending';
  
  if (failed === results.length && results.length > 0) {
    // All failed
    newStatus = 'failed';
  } else if (successful > 0 && (successful + failed) === results.length) {
    // All processed (some or all successful)
    newStatus = 'completed';
  } else {
    // Still in progress
    newStatus = 'sending';
  }
  
  console.log(`Updating campaign ${campaignId} status to: ${newStatus} (sent: ${successful}, failed: ${failed}, total: ${results.length})`);
  
  try {
    const { data: updateData, error: statusError } = await supabaseAdmin
      .from('comms_campaigns')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', campaignId)
      .select();
      
    if (statusError) {
      console.error('Error updating campaign status:', {
        error: statusError,
        message: statusError.message,
        details: statusError.details,
        hint: statusError.hint,
        code: statusError.code
      });
      
      // Try a simpler update as fallback
      console.log('Attempting fallback status update...');
      const { error: fallbackError } = await supabaseAdmin
        .from('comms_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);
        
      if (fallbackError) {
        console.error('Fallback status update also failed:', fallbackError);
      } else {
        console.log(`✅ Campaign ${campaignId} status updated via fallback to: ${newStatus}`);
      }
    } else {
      console.log(`✅ Campaign ${campaignId} status updated to: ${newStatus}`, updateData);
    }
  } catch (updateError) {
    console.error('Exception during campaign status update:', updateError);
  }
  
  return { 
    success: true, 
    total: results.length,
    sent: successful,
    failed
  };
}

/**
 * Dispatch Push Notification campaign
 */
async function dispatchPushCampaign(campaignId: string, campaign: any, recipients: any[]) {
  console.log('Dispatching push notification campaign...');
  
  // For push notifications, we should target mobile app users directly
  // Get all mobile app users with push tokens in their devices
  const { data: mobileUsers, error: usersError } = await supabaseAdmin
    .from('mobile_app_users')
    .select(`
      id,
      auth_user_id,
      contact_id,
      status,
      devices,
      contact:contact_id (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('status', 'active');
    
  if (usersError) {
    console.error('Error getting mobile app users:', usersError);
    return { success: false, error: 'Failed to get mobile app users' };
  }
  
  if (!mobileUsers || mobileUsers.length === 0) {
    console.warn('No active mobile app users found');
    return { success: false, error: 'No active mobile app users found' };
  }
  
  console.log(`Found ${mobileUsers.length} active mobile app users`);
  
  // Filter users who have push tokens in their devices
  const usersWithPushTokens = mobileUsers.filter(user => {
    if (!user.devices || !Array.isArray(user.devices)) return false;
    return user.devices.some(device => device.push_token && device.push_token.trim() !== '');
  });
  
  if (usersWithPushTokens.length === 0) {
    console.warn('No mobile app users found with push tokens');
    return { success: false, error: 'No mobile app users found with push tokens' };
  }
  
  console.log(`Found ${usersWithPushTokens.length} mobile app users with push tokens`);
  
  // Process template variables
  let title = campaign.template?.subject || 'Notification';
  let message = campaign.template?.body || '';
  
  // Get all user IDs for the push notification API
  const userIds = usersWithPushTokens
    .map(user => user.auth_user_id)
    .filter(Boolean); // Filter out any null/undefined auth_user_ids
  
  console.log(`Sending push notification to ${userIds.length} users`);
  console.log('Template:', { title, message });
  
  try {
    // Send push notification using the existing API
    const pushResult = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: userIds,
        title: title,
        body: message,
        type: 'general',
        data: {
          campaignId: campaignId,
          templateId: campaign.template_id
        }
      }),
    });
    
    const pushResponse = await pushResult.json();
    console.log('Push notification API response:', pushResponse);
    
    // Create recipient records for tracking
    const recipientRecords = usersWithPushTokens.map(user => ({
      campaign_id: campaignId,
      contact_id: user.contact_id || user.id, // Use contact_id if available, otherwise user id
      to_address: user.contact?.email || user.auth_user_id || user.id, // Use email, user ID, or mobile user ID as address
      status: pushResponse.success ? 'sent' : 'failed',
      variables: {
        first_name: user.contact?.first_name || '',
        last_name: user.contact?.last_name || '',
        full_name: `${user.contact?.first_name || ''} ${user.contact?.last_name || ''}`.trim(),
        email: user.contact?.email || '',
        phone: user.contact?.phone || '',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(pushResponse.success ? { sent_at: new Date().toISOString() } : {})
    }));
    
    // Insert recipient records for tracking
    const { error: recipientsError } = await supabaseAdmin
      .from('comms_recipients')
      .insert(recipientRecords);
      
    if (recipientsError) {
      console.error('Error creating recipient records:', recipientsError);
      // Don't fail the campaign for this
    }
    
    // Calculate metrics
    const successful = pushResponse.success ? usersWithPushTokens.length : 0;
    const failed = pushResponse.success ? 0 : usersWithPushTokens.length;
    
    console.log(`Push Campaign results: ${successful} sent, ${failed} failed`);
    
    // Update campaign status
    const newStatus = pushResponse.success ? 'completed' : 'failed';
    
    console.log(`Updating push campaign ${campaignId} status to: ${newStatus}`);
    
    const { error: statusError } = await supabaseAdmin
      .from('comms_campaigns')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', campaignId);
      
    if (statusError) {
      console.error('Error updating push campaign status:', statusError);
    } else {
      console.log(`✅ Push Campaign ${campaignId} status updated to: ${newStatus}`);
    }
    
    return { 
      success: pushResponse.success, 
      total: usersWithPushTokens.length,
      sent: successful,
      failed: failed,
      error: pushResponse.success ? null : pushResponse.error
    };
    
  } catch (error) {
    console.error('Error in push campaign dispatch:', error);
    
    // Update campaign status to failed
    await supabaseAdmin
      .from('comms_campaigns')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', campaignId);
    
    return { 
      success: false, 
      total: usersWithPushTokens.length,
      sent: 0,
      failed: usersWithPushTokens.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get campaign statistics (channel-agnostic)
 */
export async function getCampaignStats(campaignId: string) {
  try {
    console.log('Getting campaign stats for campaign:', campaignId);
    
    const { data: recipients, error } = await supabaseAdmin
      .from('comms_recipients')
      .select('status')
      .eq('campaign_id', campaignId);
    
    if (error) {
      console.error('Error getting campaign stats:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Found ${recipients?.length || 0} recipients for stats:`, recipients);
    
    // Calculate stats from recipients
    const stats = {
      total: recipients.length,
      pending: 0,
      sent: 0,
      failed: 0,
      delivered: 0,
      opened: 0,
      clicked: 0
    };
    
    // Count by status
    recipients.forEach(recipient => {
      switch (recipient.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'sent':
          stats.sent++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'opened':
          stats.opened++;
          break;
        case 'clicked':
          stats.clicked++;
          break;
      }
    });
    
    console.log('Calculated stats:', stats);
    return { success: true, stats };
  } catch (error) {
    console.error('Error in getCampaignStats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get campaign items (recipients) with optional status filter (channel-agnostic)
 */
export async function getCampaignItems(
  campaignId: string,
  status?: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked',
  limit: number = 100,
  offset: number = 0
) {
  try {
    console.log('Getting campaign items for campaign:', campaignId, 'with status:', status);
    
    let query = supabaseAdmin
      .from('comms_recipients')
      .select('*, contact:contact_id(first_name, last_name, email, phone)')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    console.log('About to execute query for comms_recipients...');
    
    const { data, error } = await query
      .range(offset, offset + limit - 1);
    
    console.log('Query result - data:', data, 'error:', error);
    
    if (error) {
      console.error('Error getting campaign items:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { success: false, error: error.message };
    }
    
    console.log(`Found ${data?.length || 0} campaign items:`, data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in getCampaignItems:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Keep backward compatibility
export const getCampaignEmailStats = getCampaignStats;
export const getCampaignEmailItems = getCampaignItems; 