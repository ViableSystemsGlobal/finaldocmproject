import { supabase } from '@/lib/supabase'
import type { Role, AdminUser } from '@/services/settings'

export interface UserPermissions {
  user: AdminUser | null
  roles: Role[]
  permissions: string[]
  department?: string
}

export interface PermissionContext {
  userId: string
  permissions: string[]
  roles: Role[]
  department?: string
}

/**
 * Get current user's permissions from their assigned roles
 */
export async function getCurrentUserPermissions(): Promise<UserPermissions> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { user: null, roles: [], permissions: [], department: undefined }
    }

    // Get user's roles and permissions
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role:roles(*)
      `)
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return { user: null, roles: [], permissions: [], department: undefined }
    }

    const roles = (userRoles || []).map(ur => ur.role).filter(Boolean) as any[]
    const permissions = roles.flatMap((role: any) => role.permissions || [])
    
    const department = user.user_metadata?.department

    const adminUser: AdminUser = {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
      department,
      user_metadata: user.user_metadata || {},
      app_metadata: (user.app_metadata || {}) as any,
      display_name: user.user_metadata?.name || 
                   `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 
                   user.email,
      is_active: true,
      roles
    }

    return {
      user: adminUser,
      roles,
      permissions: Array.from(new Set(permissions)), // Remove duplicates
      department
    }
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return { user: null, roles: [], permissions: [], department: undefined }
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: UserPermissions, permission: string): boolean {
  return userPermissions.permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: UserPermissions, permissions: string[]): boolean {
  return permissions.some(permission => userPermissions.permissions.includes(permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: UserPermissions, permissions: string[]): boolean {
  return permissions.every(permission => userPermissions.permissions.includes(permission))
}

/**
 * Check if user has a specific role
 */
export function hasRole(userPermissions: UserPermissions, roleName: string): boolean {
  return userPermissions.roles.some(role => role.name.toLowerCase() === roleName.toLowerCase())
}

/**
 * Check if user is in a specific department
 */
export function isInDepartment(userPermissions: UserPermissions, department: string): boolean {
  return userPermissions.department === department
}

/**
 * Check if user can view all records (has view:all permission) or should be filtered
 */
export function getViewScope(userPermissions: UserPermissions, entity: string): 'all' | 'department' | 'assigned' | 'none' {
  if (hasPermission(userPermissions, `${entity}:view:all`)) {
    return 'all'
  }
  if (hasPermission(userPermissions, `${entity}:view:department`)) {
    return 'department'
  }
  if (hasPermission(userPermissions, `${entity}:view:assigned`)) {
    return 'assigned'
  }
  return 'none'
}

/**
 * Check if user can edit records (returns edit scope)
 */
export function getEditScope(userPermissions: UserPermissions, entity: string): 'all' | 'assigned' | 'basic' | 'none' {
  if (hasPermission(userPermissions, `${entity}:edit:all`)) {
    return 'all'
  }
  if (hasPermission(userPermissions, `${entity}:edit:assigned`)) {
    return 'assigned'
  }
  if (hasPermission(userPermissions, `${entity}:edit:basic`)) {
    return 'basic'
  }
  return 'none'
}

/**
 * Filter query based on user permissions and scope
 */
export function applyPermissionFilter(
  query: any,
  userPermissions: UserPermissions,
  entity: string,
  options: {
    userIdColumn?: string
    departmentColumn?: string
    assignedUserColumn?: string
  } = {}
) {
  const { userIdColumn = 'user_id', departmentColumn = 'department', assignedUserColumn = 'assigned_to' } = options
  const scope = getViewScope(userPermissions, entity)

  switch (scope) {
    case 'all':
      // No filter needed
      return query
    
    case 'department':
      if (userPermissions.department) {
        return query.eq(departmentColumn, userPermissions.department)
      }
      // Fall through to assigned if no department
      
    case 'assigned':
      if (userPermissions.user?.id) {
        return query.eq(assignedUserColumn, userPermissions.user.id)
      }
      // Fall through to none if no user ID
      
    case 'none':
    default:
      // Return query that matches nothing
      return query.eq('id', '00000000-0000-0000-0000-000000000000')
  }
}

/**
 * Route protection - returns whether user can access a route
 */
export function canAccessRoute(userPermissions: UserPermissions, route: string): boolean {
  const routePermissions: Record<string, string[]> = {
    '/dashboard': ['dashboard:view'],
    
    // Reports & Analytics
    '/reports': ['reports:view:all', 'attendance:reports', 'giving:reports', 'comms:reports'],
    '/reports/people': ['reports:view:all', 'contacts:view:all'],
    '/reports/attendance': ['reports:view:all', 'attendance:reports'],
    '/reports/financial': ['reports:view:all', 'giving:reports'],
    '/reports/communication': ['reports:view:all', 'comms:reports'],
    
    // People Management
    '/people': ['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned'],
    '/people/contacts': ['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned'],
    '/people/members': ['members:view:all', 'contacts:view:all'],
    '/people/visitors': ['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned'],
    '/people/groups': ['groups:view:all', 'groups:view:department'],
    '/people/attendance': ['attendance:view:all', 'attendance:view:department'],
    '/people/discipleship': ['discipleship:view:all', 'discipleship:view:department'],
    
    // Outreach
    '/people/outreach': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
    '/people/outreach/follow-ups': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
    '/people/outreach/soul-winning': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
    '/people/outreach/prayer-requests': ['prayers:view:all', 'prayers:view:department', 'prayers:view:assigned'],
    '/people/outreach/planned-visits': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
    '/people/outreach/website-messages': ['comms:view:all', 'followups:view:all'],
    
    // Other People sections
    '/people/transport': ['events:view:all', 'events:view:assigned'],
    '/people/mobile-users': ['admin:settings'],
    
    // Events
    '/events': ['events:view:all', 'events:view:assigned'],
    
    // Finance & Giving
    '/finance': ['giving:view:all', 'giving:view:summary'],
    '/finance/giving': ['giving:view:all', 'giving:view:summary'],
    '/finance/expenses': ['giving:view:all'],
    '/finance/assets': ['giving:view:all'],
    
    // Communications
    '/comms': ['comms:view:all'],
    '/comms/newsletter': ['comms:view:all'],
    '/comms/campaigns': ['comms:view:all'],
    '/comms/templates': ['comms:view:all'],
    
    // Content Management
    '/content': ['sermons:view:all', 'blogs:view:all', 'media:view:all'],
    '/content/sermons': ['sermons:view:all'],
    '/content/blogs': ['blogs:view:all'],
    '/content/media': ['media:view:all'],
    
    // Settings & Administration
    '/settings': ['admin:settings', 'roles:manage'],
    '/settings/roles': ['roles:manage', 'admin:users']
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) {
    // If route not defined, allow access (or you could default to deny)
    return true
  }

  return hasAnyPermission(userPermissions, requiredPermissions)
}

/**
 * Get accessible navigation items based on user permissions
 */
export function getAccessibleNavigation(userPermissions: UserPermissions) {
  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'People', href: '/people', icon: 'Users' },
    { name: 'Groups', href: '/groups', icon: 'Users' },
    { name: 'Events', href: '/events', icon: 'Calendar' },
    { name: 'Content', href: '/content', icon: 'FileText' },
    { name: 'Communications', href: '/communications', icon: 'MessageSquare' },
    { name: 'Giving', href: '/giving', icon: 'DollarSign' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ]

  return allNavItems.filter(item => canAccessRoute(userPermissions, item.href))
}

/**
 * UI permission helpers
 */
export const PermissionUtils = {
  canView: (userPermissions: UserPermissions, entity: string) => 
    getViewScope(userPermissions, entity) !== 'none',
  
  canEdit: (userPermissions: UserPermissions, entity: string) => 
    getEditScope(userPermissions, entity) !== 'none',
  
  canCreate: (userPermissions: UserPermissions, entity: string) => 
    hasPermission(userPermissions, `${entity}:create`),
  
  canDelete: (userPermissions: UserPermissions, entity: string) => 
    hasPermission(userPermissions, `${entity}:delete`),
  
  canExport: (userPermissions: UserPermissions, entity: string) => 
    hasPermission(userPermissions, `${entity}:export`),
  
  canManage: (userPermissions: UserPermissions, entity: string) => 
    hasPermission(userPermissions, `${entity}:manage:all`) || 
    hasPermission(userPermissions, `${entity}:edit:all`),

  isAdmin: (userPermissions: UserPermissions) => 
    hasRole(userPermissions, 'admin') || hasPermission(userPermissions, 'admin:full'),
} 