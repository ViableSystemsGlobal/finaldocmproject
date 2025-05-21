import { supabase } from '@/lib/supabase';

export type CommsTemplate = {
  id: string
  name: string
  channel: 'email' | 'sms' | 'whatsapp' | 'push'
  subject?: string
  body: string
  variables_schema: any[]
  created_at: string
  updated_at: string
}

export type CreateTemplateParams = {
  name: string
  channel: CommsTemplate['channel']
  subject?: string
  body: string
  variables_schema?: any[]
}

export type UpdateTemplateParams = Partial<CreateTemplateParams>

/**
 * Fetch all communication templates
 */
export async function fetchTemplates() {
  const { data, error } = await supabase
    .from('comms_templates')
    .select('*')
    .order('updated_at', { ascending: false })
  
  return { data: data as CommsTemplate[] | null, error }
}

/**
 * Fetch templates filtered by channel
 */
export async function fetchTemplatesByChannel(channel: CommsTemplate['channel']) {
  const { data, error } = await supabase
    .from('comms_templates')
    .select('*')
    .eq('channel', channel)
    .order('updated_at', { ascending: false })
  
  return { data: data as CommsTemplate[] | null, error }
}

/**
 * Fetch a single template by ID
 */
export async function fetchTemplate(id: string) {
  const { data, error } = await supabase
    .from('comms_templates')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data: data as CommsTemplate | null, error }
}

/**
 * Create a new communication template
 */
export async function createTemplate(params: CreateTemplateParams) {
  const { data, error } = await supabase
    .from('comms_templates')
    .insert([params])
    .select()
    .single()
  
  return { data: data as CommsTemplate | null, error }
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: string, params: UpdateTemplateParams) {
  const { data, error } = await supabase
    .from('comms_templates')
    .update(params)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as CommsTemplate | null, error }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('comms_templates')
    .delete()
    .eq('id', id)
  
  return { success: !error, error }
} 