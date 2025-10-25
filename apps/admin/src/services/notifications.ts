import { supabase, supabaseAdmin } from '@/lib/supabase'

// Types
export type NotificationMethod = 'email' | 'sms' | 'push' | 'in_app'
export type NotificationUrgency = 'low' | 'normal' | 'high' | 'critical'
export type NotificationCategory = 'membership' | 'visitors' | 'events' | 'giving' | 'pastoral' | 'system'
export type DigestFrequency = 'daily' | 'weekly'

export type GlobalNotificationSettings = {
  id?: string
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  digestModeEnabled: boolean
  digestFrequency: DigestFrequency
  digestTime: string
  createdAt?: string
  updatedAt?: string
}

export type NotificationType = {
  id: string
  name: string
  description: string
  category: NotificationCategory
  defaultEmail: boolean
  defaultSms: boolean
  defaultPush: boolean
  defaultInApp: boolean
  urgencyLevel: NotificationUrgency
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export type NotificationTypeSetting = {
  id?: string
  notificationTypeId: string
  method: NotificationMethod
  enabled: boolean
  roles: string[]
  templateOverride?: string
  delayMinutes?: number
  createdAt?: string
  updatedAt?: string
}

export type RoleNotificationPreference = {
  id?: string
  roleId: string
  roleName: string
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export type UserNotificationPreference = {
  id?: string
  userId: string
  notificationTypeId: string
  method: NotificationMethod
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

// Database field mapping
type GlobalNotificationSettingsDB = {
  id?: string
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  digest_mode_enabled: boolean
  digest_frequency: DigestFrequency
  digest_time: string
  created_at?: string
  updated_at?: string
}

type NotificationTypeDB = {
  id: string
  name: string
  description: string
  category: NotificationCategory
  default_email: boolean
  default_sms: boolean
  default_push: boolean
  default_in_app: boolean
  urgency_level: NotificationUrgency
  enabled: boolean
  created_at?: string
  updated_at?: string
}

type NotificationTypeSettingDB = {
  id?: string
  notification_type_id: string
  method: NotificationMethod
  enabled: boolean
  roles: string[]
  template_override?: string
  delay_minutes?: number
  created_at?: string
  updated_at?: string
}

type RoleNotificationPreferenceDB = {
  id?: string
  role_id: string
  role_name: string
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  created_at?: string
  updated_at?: string
}

type UserNotificationPreferenceDB = {
  id?: string
  user_id: string
  notification_type_id: string
  method: NotificationMethod
  enabled: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Convert database format to component format for global settings
 */
function dbToComponent(dbData: GlobalNotificationSettingsDB): GlobalNotificationSettings {
  return {
    id: dbData.id,
    emailEnabled: dbData.email_enabled,
    smsEnabled: dbData.sms_enabled,
    pushEnabled: dbData.push_enabled,
    inAppEnabled: dbData.in_app_enabled,
    quietHoursEnabled: dbData.quiet_hours_enabled,
    quietHoursStart: dbData.quiet_hours_start,
    quietHoursEnd: dbData.quiet_hours_end,
    digestModeEnabled: dbData.digest_mode_enabled,
    digestFrequency: dbData.digest_frequency,
    digestTime: dbData.digest_time,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at
  }
}

/**
 * Convert component format to database format for global settings
 */
function componentToDb(componentData: GlobalNotificationSettings): GlobalNotificationSettingsDB {
  return {
    id: componentData.id,
    email_enabled: componentData.emailEnabled,
    sms_enabled: componentData.smsEnabled,
    push_enabled: componentData.pushEnabled,
    in_app_enabled: componentData.inAppEnabled,
    quiet_hours_enabled: componentData.quietHoursEnabled,
    quiet_hours_start: componentData.quietHoursStart,
    quiet_hours_end: componentData.quietHoursEnd,
    digest_mode_enabled: componentData.digestModeEnabled,
    digest_frequency: componentData.digestFrequency,
    digest_time: componentData.digestTime,
    created_at: componentData.createdAt,
    updated_at: componentData.updatedAt
  }
}

/**
 * Convert notification type from database format
 */
function dbToNotificationType(dbData: NotificationTypeDB): NotificationType {
  return {
    id: dbData.id,
    name: dbData.name,
    description: dbData.description,
    category: dbData.category,
    defaultEmail: dbData.default_email,
    defaultSms: dbData.default_sms,
    defaultPush: dbData.default_push,
    defaultInApp: dbData.default_in_app,
    urgencyLevel: dbData.urgency_level,
    enabled: dbData.enabled,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at
  }
}

/**
 * Convert notification type setting from database format
 */
function dbToNotificationTypeSetting(dbData: NotificationTypeSettingDB): NotificationTypeSetting {
  return {
    id: dbData.id,
    notificationTypeId: dbData.notification_type_id,
    method: dbData.method,
    enabled: dbData.enabled,
    roles: dbData.roles,
    templateOverride: dbData.template_override,
    delayMinutes: dbData.delay_minutes,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at
  }
}

/**
 * Convert role preference from database format
 */
function dbToRolePreference(dbData: RoleNotificationPreferenceDB): RoleNotificationPreference {
  return {
    id: dbData.id,
    roleId: dbData.role_id,
    roleName: dbData.role_name,
    emailEnabled: dbData.email_enabled,
    smsEnabled: dbData.sms_enabled,
    pushEnabled: dbData.push_enabled,
    inAppEnabled: dbData.in_app_enabled,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at
  }
}

/**
 * Convert user preference from database format
 */
function dbToUserPreference(dbData: UserNotificationPreferenceDB): UserNotificationPreference {
  return {
    id: dbData.id,
    userId: dbData.user_id,
    notificationTypeId: dbData.notification_type_id,
    method: dbData.method,
    enabled: dbData.enabled,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at
  }
}

/**
 * Fetch global notification settings
 */
export async function fetchGlobalSettings(): Promise<{ data: GlobalNotificationSettings | null, error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .single()

    if (error && error.code === 'PGRST116') {
      // No data found, return default structure
      return { data: null, error: null }
    }

    if (error) {
      throw error
    }

    return { data: dbToComponent(data as GlobalNotificationSettingsDB), error: null }
  } catch (error) {
    console.error('Error fetching global notification settings:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save global notification settings
 */
export async function saveGlobalSettings(settings: Omit<GlobalNotificationSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, error?: any }> {
  try {
    // Convert to database format
    const dbData = componentToDb(settings as GlobalNotificationSettings)
    
    // Check if settings already exist
    const { data: existing } = await supabaseAdmin
      .from('notification_settings')
      .select('id')
      .single()

    if (existing) {
      // Update existing settings
      const { error } = await supabaseAdmin
        .from('notification_settings')
        .update({
          ...dbData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        // Check if it's a table not found error
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return { 
            success: false, 
            error: 'Database tables not found. Please run database migrations first.' 
          }
        }
        throw error
      }
    } else {
      // Create new settings
      const { error } = await supabaseAdmin
        .from('notification_settings')
        .insert({
          ...dbData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        // Check if it's a table not found error
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return { 
            success: false, 
            error: 'Database tables not found. Please run database migrations first.' 
          }
        }
        throw error
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving global notification settings:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Unknown error'
    if (error && typeof error === 'object') {
      const err = error as any
      if (err.code === '42P01') {
        errorMessage = 'Database tables not found. Please run database migrations first.'
      } else if (err.code === '23514') {
        errorMessage = 'Invalid notification method. Use: email, sms, push, or in_app.'
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.details) {
        errorMessage = err.details
      } else {
        errorMessage = 'Database connection error. Please check your database configuration.'
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

/**
 * Fetch all notification types
 */
export async function fetchNotificationTypes(): Promise<{ data: NotificationType[], error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_types')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    const notificationTypes = (data || []).map(dbToNotificationType)
    return { data: notificationTypes, error: null }
  } catch (error) {
    console.error('Error fetching notification types:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetch notification type settings
 */
export async function fetchNotificationTypeSettings(): Promise<{ data: NotificationTypeSetting[], error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_type_settings')
      .select('*')
      .order('notification_type_id', { ascending: true })
      .order('method', { ascending: true })

    if (error) throw error

    const settings = (data || []).map(dbToNotificationTypeSetting)
    return { data: settings, error: null }
  } catch (error) {
    console.error('Error fetching notification type settings:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save notification type setting
 */
export async function saveNotificationTypeSetting(setting: Omit<NotificationTypeSetting, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, error?: any }> {
  try {
    const { error } = await supabaseAdmin
      .from('notification_type_settings')
      .upsert({
        notification_type_id: setting.notificationTypeId,
        method: setting.method,
        enabled: setting.enabled,
        roles: setting.roles,
        template_override: setting.templateOverride,
        delay_minutes: setting.delayMinutes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'notification_type_id,method'
      })

    if (error) {
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Database tables not found. Please run database migrations first.' 
        }
      }
      throw error
    }
    return { success: true }
  } catch (error) {
    console.error('Error saving notification type setting:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Unknown error'
    if (error && typeof error === 'object') {
      const err = error as any
      if (err.code === '42P01') {
        errorMessage = 'Database tables not found. Please run database migrations first.'
      } else if (err.code === '23514') {
        errorMessage = 'Invalid notification method. Use: email, sms, push, or in_app.'
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.details) {
        errorMessage = err.details
      } else {
        errorMessage = 'Database connection error. Please check your database configuration.'
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

/**
 * Fetch role notification preferences
 */
export async function fetchRolePreferences(): Promise<{ data: RoleNotificationPreference[], error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('role_notification_preferences')
      .select('*')
      .order('role_name', { ascending: true })

    if (error) throw error

    const preferences = (data || []).map(dbToRolePreference)
    return { data: preferences, error: null }
  } catch (error) {
    console.error('Error fetching role preferences:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save role notification preference
 */
export async function saveRolePreference(preference: Omit<RoleNotificationPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, error?: any }> {
  try {
    const { error } = await supabaseAdmin
      .from('role_notification_preferences')
      .upsert({
        role_id: preference.roleId,
        role_name: preference.roleName,
        email_enabled: preference.emailEnabled,
        sms_enabled: preference.smsEnabled,
        push_enabled: preference.pushEnabled,
        in_app_enabled: preference.inAppEnabled,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'role_id'
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error saving role preference:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetch user notification preferences
 */
export async function fetchUserPreferences(userId: string): Promise<{ data: UserNotificationPreference[], error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('notification_type_id', { ascending: true })
      .order('method', { ascending: true })

    if (error) throw error

    const preferences = (data || []).map(dbToUserPreference)
    return { data: preferences, error: null }
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save user notification preference
 */
export async function saveUserPreference(preference: Omit<UserNotificationPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, error?: any }> {
  try {
    const { error } = await supabaseAdmin
      .from('user_notification_preferences')
      .upsert({
        user_id: preference.userId,
        notification_type_id: preference.notificationTypeId,
        method: preference.method,
        enabled: preference.enabled,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_type_id,method'
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error saving user preference:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get default notification settings
 */
export function getDefaultGlobalSettings(): GlobalNotificationSettings {
  return {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    digestModeEnabled: false,
    digestFrequency: 'daily',
    digestTime: '09:00'
  }
}

/**
 * Test notification
 */
export async function testNotification(method: NotificationMethod, recipient: string): Promise<{ success: boolean, error?: any }> {
  try {
    // This would integrate with your actual notification service
    // For now, we'll simulate the test
    console.log(`Testing ${method} notification to ${recipient}`)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return { success: true }
  } catch (error) {
    console.error('Error testing notification:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 