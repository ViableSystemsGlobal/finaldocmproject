import { supabase } from '@/lib/supabase';

export type CommsRecipient = {
  id: string
  campaign_id: string
  contact_id: string | null
  to_address: string
  variables: any | null
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked'
  last_error: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  // Join data
  contacts?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null
}

export type CreateRecipientParams = {
  campaign_id: string
  contact_id?: string | null
  to_address: string
  variables?: any | null
}

export type UpdateRecipientParams = Partial<{
  status: CommsRecipient['status']
  last_error: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
}>

/**
 * Fetch all recipients for a campaign
 */
export async function fetchRecipients(campaignId: string) {
  const { data, error } = await supabase
    .from('comms_recipients')
    .select(`
      *,
      contacts(id, first_name, last_name, email, phone)
    `)
    .eq('campaign_id', campaignId)
    .order('id')
  
  return { data: data as CommsRecipient[] | null, error }
}

/**
 * Fetch recipients for a campaign by status
 */
export async function fetchRecipientsByStatus(campaignId: string, status: CommsRecipient['status']) {
  const { data, error } = await supabase
    .from('comms_recipients')
    .select(`
      *,
      contacts(id, first_name, last_name, email, phone)
    `)
    .eq('campaign_id', campaignId)
    .eq('status', status)
    .order('id')
  
  return { data: data as CommsRecipient[] | null, error }
}

/**
 * Create a new recipient for a campaign
 */
export async function createRecipient(params: CreateRecipientParams) {
  const { data, error } = await supabase
    .from('comms_recipients')
    .insert([params])
    .select()
    .single()
  
  return { data: data as CommsRecipient | null, error }
}

/**
 * Batch create multiple recipients for a campaign
 */
export async function createRecipientsBatch(recipients: CreateRecipientParams[]) {
  const { data, error } = await supabase
    .from('comms_recipients')
    .insert(recipients)
    .select()
  
  return { data: data as CommsRecipient[] | null, error, count: data?.length || 0 }
}

/**
 * Update a recipient's status
 */
export async function updateRecipient(id: string, params: UpdateRecipientParams) {
  const { data, error } = await supabase
    .from('comms_recipients')
    .update(params)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as CommsRecipient | null, error }
}

/**
 * Retry sending to a failed recipient
 */
export async function retryRecipient(id: string) {
  // First get the recipient and campaign to determine the channel
  const { data: recipient, error: recipientError } = await supabase
    .from('comms_recipients')
    .select(`
      *,
      campaign:campaign_id(channel)
    `)
    .eq('id', id)
    .single()
  
  if (recipientError || !recipient) {
    return { success: false, error: recipientError }
  }
  
  // Update recipient status to pending
  const { error: updateError } = await supabase
    .from('comms_recipients')
    .update({ 
      status: 'pending',
      last_error: null
    })
    .eq('id', id)
  
  if (updateError) {
    return { success: false, error: updateError }
  }
  
  // Call the appropriate edge function based on the channel
  try {
    const campaign = recipient.campaign as any
    const functionName = `send_${campaign.channel}_single`
    
    const { error: functionError } = await supabase.functions.invoke(functionName, {
      body: { recipient_id: id }
    })
    
    if (functionError) {
      return { success: false, error: functionError }
    }
    
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Cancel a pending recipient
 */
export async function cancelRecipient(id: string) {
  const { data, error } = await supabase
    .from('comms_recipients')
    .update({ status: 'failed', last_error: 'Manually cancelled' })
    .eq('id', id)
    .eq('status', 'pending') // Only cancel if still pending
    .select()
    .single()
  
  return { data: data as CommsRecipient | null, error }
} 