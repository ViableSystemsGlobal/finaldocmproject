// Audit logging utilities for tracking user actions and system events
import { supabaseAdmin } from '@/lib/supabase'

export interface AuditLogEntry {
  user_id?: string | null
  action: string
  entity: string
  entity_id?: string | null
  old_values?: any
  new_values?: any
  ip_address?: string | null
  user_agent?: string | null
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert([entry])

    if (error) {
      console.error('❌ Failed to create audit log:', error)
      return false
    }

    console.log(`📝 Audit log created: ${entry.action} on ${entry.entity}`)
    return true
  } catch (error) {
    console.error('💥 Unexpected error creating audit log:', error)
    return false
  }
}

/**
 * Get request metadata for audit logging (server-side only)
 * Returns empty object when called from client-side
 */
export async function getRequestMetadata(): Promise<{
  ip_address?: string
  user_agent?: string
}> {
  try {
    // Check if we're in a server context
    if (typeof window !== 'undefined') {
      // Client-side - return empty metadata
      return {}
    }

    // Server-side - try to get headers
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || undefined
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined

    return {
      ip_address: ipAddress,
      user_agent: userAgent
    }
  } catch (error) {
    console.warn('⚠️ Failed to get request metadata (client-side context):', error)
    return {}
  }
}

/**
 * Log user creation action
 */
export async function logUserCreate(
  createdUserId: string,
  userData: any,
  adminUserId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: adminUserId,
    action: 'create',
    entity: 'user',
    entity_id: createdUserId,
    new_values: userData,
    ...metadata
  })
}

/**
 * Log user update action
 */
export async function logUserUpdate(
  updatedUserId: string,
  oldValues: any,
  newValues: any,
  adminUserId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: adminUserId,
    action: 'update',
    entity: 'user',
    entity_id: updatedUserId,
    old_values: oldValues,
    new_values: newValues,
    ...metadata
  })
}

/**
 * Log user deletion action
 */
export async function logUserDelete(
  deletedUserId: string,
  userData: any,
  adminUserId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: adminUserId,
    action: 'delete',
    entity: 'user',
    entity_id: deletedUserId,
    old_values: userData,
    ...metadata
  })
}

/**
 * Log user login action
 */
export async function logUserLogin(
  userId: string,
  loginData?: any
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action: 'login',
    entity: 'auth',
    new_values: { session_started: true, ...loginData },
    ...metadata
  })
}

/**
 * Log user logout action
 */
export async function logUserLogout(
  userId: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action: 'logout',
    entity: 'auth',
    new_values: { session_ended: true },
    ...metadata
  })
}

/**
 * Log data export action
 */
export async function logDataExport(
  entityType: string,
  exportData: any,
  userId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action: 'export',
    entity: entityType,
    new_values: exportData,
    ...metadata
  })
}

/**
 * Log email sending action
 */
export async function logEmailSend(
  campaignId: string,
  emailData: any,
  userId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action: 'send_email',
    entity: 'communication',
    entity_id: campaignId,
    new_values: emailData,
    ...metadata
  })
}

/**
 * Log SMS sending action
 */
export async function logSmsSend(
  campaignId: string,
  smsData: any,
  userId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action: 'send_sms',
    entity: 'communication',
    entity_id: campaignId,
    new_values: smsData,
    ...metadata
  })
}

/**
 * Log settings change action
 */
export async function logSettingsChange(
  settingType: string,
  oldValues: any,
  newValues: any,
  userId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action: 'settings',
    entity: 'system',
    entity_id: settingType,
    old_values: oldValues,
    new_values: newValues,
    ...metadata
  })
}

/**
 * Log page/data view action
 */
export async function logDataView(
  entityType: string,
  viewData: any,
  userId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action: 'view',
    entity: entityType,
    new_values: viewData,
    ...metadata
  })
}

/**
 * Log generic CRUD action
 */
export async function logCrudAction(
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  userId?: string
): Promise<void> {
  const metadata = await getRequestMetadata()
  
  await createAuditLog({
    user_id: userId,
    action,
    entity: entityType,
    entity_id: entityId,
    old_values: oldValues,
    new_values: newValues,
    ...metadata
  })
} 