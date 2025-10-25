import { supabase } from '@/lib/supabase'

export interface WebsiteMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  source: string
  status: 'unread' | 'read' | 'responded' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category?: string
  assigned_to?: string
  response_notes?: string
  responded_at?: string
  responded_by?: string
  created_at: string
  updated_at: string
  assigned_user?: {
    id: string
    email: string
    raw_user_meta_data?: {
      first_name?: string
      last_name?: string
    }
  }
  responded_user?: {
    id: string
    email: string
    raw_user_meta_data?: {
      first_name?: string
      last_name?: string
    }
  }
}

export interface WebsiteMessageMetrics {
  totalMessages: number
  unreadMessages: number
  respondedToday: number
  highPriorityMessages: number
  loading: boolean
  error?: string
}

// Fetch all website messages
export async function fetchWebsiteMessages(page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('website_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return { data, error: null, count }
  } catch (error) {
    console.error('Error fetching website messages:', error)
    return { data: null, error, count: 0 }
  }
}

// Fetch website message by ID
export async function fetchWebsiteMessageById(id: string) {
  try {
    const { data, error } = await supabase
      .from('website_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching website message:', error)
    return { data: null, error }
  }
}

// Create new website message
export async function createWebsiteMessage(message: Partial<WebsiteMessage>) {
  try {
    const { data, error } = await supabase
      .from('website_messages')
      .insert([message])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating website message:', error)
    return { data: null, error }
  }
}

// Update website message
export async function updateWebsiteMessage(id: string, updates: Partial<WebsiteMessage>) {
  try {
    const { data, error } = await supabase
      .from('website_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating website message:', error)
    return { data: null, error }
  }
}

// Delete website message
export async function deleteWebsiteMessage(id: string) {
  try {
    const { error } = await supabase
      .from('website_messages')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting website message:', error)
    return { error }
  }
}

// Mark message as read
export async function markMessageAsRead(id: string) {
  return updateWebsiteMessage(id, { status: 'read' })
}

// Mark message as responded
export async function markMessageAsResponded(id: string, responseNotes: string, respondedBy?: string) {
  return updateWebsiteMessage(id, {
    status: 'responded',
    response_notes: responseNotes,
    responded_at: new Date().toISOString(),
    responded_by: respondedBy
  })
}

// Archive message
export async function archiveMessage(id: string) {
  return updateWebsiteMessage(id, { status: 'archived' })
}

// Assign message to user
export async function assignMessage(id: string, userId: string) {
  return updateWebsiteMessage(id, { assigned_to: userId })
}

// Get website messages metrics
export async function getWebsiteMessagesMetrics(): Promise<WebsiteMessageMetrics> {
  try {
    const { data, error } = await supabase.rpc('get_website_messages_metrics')

    if (error) throw error

    return {
      totalMessages: data.totalMessages || 0,
      unreadMessages: data.unreadMessages || 0,
      respondedToday: data.respondedToday || 0,
      highPriorityMessages: data.highPriorityMessages || 0,
      loading: false,
      error: data.error
    }
  } catch (error) {
    console.error('Error fetching website messages metrics:', error)
    return {
      totalMessages: 0,
      unreadMessages: 0,
      respondedToday: 0,
      highPriorityMessages: 0,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to load metrics'
    }
  }
}

// Get messages count by status
export async function getMessagesCountByStatus(status: string) {
  try {
    const { count, error } = await supabase
      .from('website_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (error) throw error

    return { count, error: null }
  } catch (error) {
    console.error('Error getting messages count:', error)
    return { count: 0, error }
  }
}

// Get messages count by priority
export async function getMessagesCountByPriority(priority: string) {
  try {
    const { count, error } = await supabase
      .from('website_messages')
      .select('*', { count: 'exact', head: true })
      .eq('priority', priority)

    if (error) throw error

    return { count, error: null }
  } catch (error) {
    console.error('Error getting messages count by priority:', error)
    return { count: 0, error }
  }
}

// Get messages count by category
export async function getMessagesCountByCategory(category: string) {
  try {
    const { count, error } = await supabase
      .from('website_messages')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)

    if (error) throw error

    return { count, error: null }
  } catch (error) {
    console.error('Error getting messages count by category:', error)
    return { count: 0, error }
  }
} 