import { supabase } from '@/lib/supabase';
import { CommsTemplate } from './templates'

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
 * Fetch all communication campaigns
 */
export async function fetchCampaigns() {
  const { data, error } = await supabase
    .from('comms_campaigns')
    .select(`
      *,
      template:template_id(*)
    `)
    .order('updated_at', { ascending: false })
  
  return { data: data as CommsCampaign[] | null, error }
}

/**
 * Fetch campaigns by status
 */
export async function fetchCampaignsByStatus(status: CommsCampaign['status']) {
  const { data, error } = await supabase
    .from('comms_campaigns')
    .select(`
      *,
      template:template_id(*)
    `)
    .eq('status', status)
    .order('updated_at', { ascending: false })
  
  return { data: data as CommsCampaign[] | null, error }
}

/**
 * Fetch a single campaign by ID
 */
export async function fetchCampaign(id: string) {
  const { data, error } = await supabase
    .from('comms_campaigns')
    .select(`
      *,
      template:template_id(*)
    `)
    .eq('id', id)
    .single()
  
  return { data: data as CommsCampaign | null, error }
}

/**
 * Create a new communication campaign
 */
export async function createCampaign(params: CreateCampaignParams) {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('comms_campaigns')
    .insert([{
      ...params,
      created_by: userData.user?.id,
    }])
    .select()
    .single()
  
  return { data: data as CommsCampaign | null, error }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(id: string, params: UpdateCampaignParams) {
  const { data, error } = await supabase
    .from('comms_campaigns')
    .update(params)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as CommsCampaign | null, error }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string) {
  const { error } = await supabase
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
  
  const { data, error } = await supabase
    .from('comms_campaigns')
    .update(params)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as CommsCampaign | null, error }
}

/**
 * Cancel a scheduled campaign
 */
export async function cancelCampaign(id: string) {
  const { data, error } = await supabase
    .from('comms_campaigns')
    .update({ status: 'draft', scheduled_at: null })
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as CommsCampaign | null, error }
}

/**
 * Get metrics for a specific campaign
 */
export async function getCampaignMetrics(campaignId: string): Promise<{ data: CampaignMetrics | null, error: any }> {
  const { data, error } = await supabase
    .rpc('get_comms_campaign_metrics', { campaign_id: campaignId })
    .single()
  
  return { data: data as CampaignMetrics | null, error }
}

/**
 * Get global communications metrics
 */
export async function getCommsMetrics(): Promise<{ data: GlobalCommsMetrics | null, error: any }> {
  const { data, error } = await supabase
    .rpc('get_comms_metrics')
    .single()
  
  return { data: data as GlobalCommsMetrics | null, error }
}

/**
 * Send a campaign immediately
 */
export async function sendCampaignNow(id: string) {
  // First update the campaign status to 'sending'
  const { data, error } = await supabase
    .from('comms_campaigns')
    .update({ status: 'sending', scheduled_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return { success: false, error }
  }
  
  // Call the appropriate edge function based on the channel
  try {
    const campaign = data as CommsCampaign
    const functionName = `send_${campaign.channel}_batch`
    
    const { error: functionError } = await supabase.functions.invoke(functionName, {
      body: { campaign_id: id }
    })
    
    if (functionError) {
      return { success: false, error: functionError }
    }
    
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
} 