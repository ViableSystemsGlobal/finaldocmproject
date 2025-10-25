import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

export type CommsRecipient = {
  id: string
  campaign_id: string
  to_address: string
  channel: 'email' | 'sms' | 'whatsapp' | 'push'
  contact_id?: string
  variables?: any
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  created_at: string
  updated_at: string
  // Join data
  contact?: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

export type CreateRecipientParams = {
  campaign_id: string
  to_address: string
  channel: CommsRecipient['channel']
  contact_id?: string
  variables?: any
}

export type UpdateRecipientParams = Partial<CreateRecipientParams> & {
  status?: CommsRecipient['status']
}

/**
 * Fetch all recipients for a campaign
 */
export async function fetchCampaignRecipients(campaignId: string) {
  const { data, error } = await supabaseAdmin
    .from('campaign_recipients')
    .select(`
      *,
      contact:contact_id(
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('campaign_id', campaignId)
  
  return { data: data as CommsRecipient[] | null, error }
}

/**
 * Create a new recipient
 */
export async function createRecipient(params: CreateRecipientParams) {
  const { data, error } = await supabaseAdmin
    .from('campaign_recipients')
    .insert([params])
    .select()
    .single()
  
  return { data: data as CommsRecipient | null, error }
}

/**
 * Create multiple recipients in batch
 */
export async function createRecipients(recipients: CreateRecipientParams[]) {
  if (recipients.length === 0) {
    return { data: [], error: null }
  }
  
  const { data, error } = await supabaseAdmin
    .from('campaign_recipients')
    .insert(recipients)
    .select()
  
  return { data: data as CommsRecipient[] | null, error }
}

/**
 * Update a recipient
 */
export async function updateRecipient(id: string, params: UpdateRecipientParams) {
  const { data, error } = await supabaseAdmin
    .from('campaign_recipients')
    .update(params)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as CommsRecipient | null, error }
}

/**
 * Delete a recipient
 */
export async function deleteRecipient(id: string) {
  const { error } = await supabaseAdmin
    .from('campaign_recipients')
    .delete()
    .eq('id', id)
  
  return { success: !error, error }
}

/**
 * Fetch recipients by status
 */
export async function fetchRecipientsByStatus(campaignId: string, status: CommsRecipient['status']) {
  const { data, error } = await supabaseAdmin
    .from('campaign_recipients')
    .select(`
      *,
      contact:contact_id(
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('status', status)
  
  return { data: data as CommsRecipient[] | null, error }
}

/**
 * Import recipients from contacts
 */
export async function importRecipientsFromContacts(
  campaignId: string, 
  contactIds: string[], 
  channel: CommsRecipient['channel']
) {
  // First fetch the contacts
  const { data: contacts, error: contactsError } = await supabaseAdmin
    .from('contacts')
    .select('id, first_name, last_name, email, phone')
    .in('id', contactIds)
  
  if (contactsError || !contacts) {
    return { success: false, error: contactsError }
  }
  
  // Map contacts to recipients
  const recipients = contacts.map(contact => {
    // Choose the appropriate address based on channel
    let toAddress = ''
    if (channel === 'email') {
      toAddress = contact.email || ''
    } else if (['sms', 'whatsapp'].includes(channel)) {
      toAddress = contact.phone || ''
    }
    
    // Skip if no valid address
    if (!toAddress) return null
    
    return {
      campaign_id: campaignId,
      contact_id: contact.id,
      to_address: toAddress,
      channel,
      variables: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        name: `${contact.first_name} ${contact.last_name}`.trim()
      }
    }
  }).filter(Boolean) as CreateRecipientParams[]
  
  if (recipients.length === 0) {
    return { 
      success: false, 
      error: 'No valid recipients could be created from the selected contacts' 
    }
  }
  
  // Create the recipients
  const { data, error } = await supabaseAdmin
    .from('campaign_recipients')
    .insert(recipients)
    .select()
  
  return { 
    success: !error, 
    data, 
    error,
    created: recipients.length
  }
}

/**
 * Create multiple recipients in batch for the unified comms system
 */
export async function createCommsRecipients(recipients: CreateRecipientParams[]) {
  if (recipients.length === 0) {
    return { data: [], error: null }
  }
  
  const { data, error } = await supabaseAdmin
    .from('comms_recipients')
    .insert(recipients)
    .select()
  
  return { data: data as CommsRecipient[] | null, error }
}

/**
 * Fetch all recipients for a campaign from the unified comms system
 */
export async function fetchCommsRecipients(campaignId: string) {
  const { data, error } = await supabaseAdmin
    .from('comms_recipients')
    .select(`
      *,
      contact:contact_id(
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('campaign_id', campaignId)
  
  return { data: data as CommsRecipient[] | null, error }
} 