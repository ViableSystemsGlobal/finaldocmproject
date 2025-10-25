import { ReactNode } from 'react'
import { useGroupPermissions } from '@/hooks/useGroupPermissions'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GroupPermissionGuardProps {
  children: ReactNode
  groupId: string
  userId: string
  requiredPermission?: string
  requiresLeadership?: boolean
  fallback?: ReactNode
  loadingFallback?: ReactNode
  showErrorMessage?: boolean
}

export function GroupPermissionGuard({
  children,
  groupId,
  userId,
  requiredPermission,
  requiresLeadership = false,
  fallback,
  loadingFallback,
  showErrorMessage = true
}: GroupPermissionGuardProps) {
  const { 
    isGroupLeader, 
    hasPermission, 
    getPermission, 
    loading 
  } = useGroupPermissions(groupId, userId)

  // Show loading state
  if (loading) {
    return loadingFallback || (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-slate-600">Checking permissions...</span>
      </div>
    )
  }

  // Check if user meets leadership requirement
  if (requiresLeadership && !isGroupLeader) {
    if (fallback) return <>{fallback}</>
    
    return showErrorMessage ? (
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          You must be a group leader to access this feature.
        </AlertDescription>
      </Alert>
    ) : null
  }

  // Check specific permission if required
  if (requiredPermission) {
    const permission = getPermission(requiredPermission)
    
    if (!permission.hasPermission) {
      if (fallback) return <>{fallback}</>
      
      return showErrorMessage ? (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have permission to {requiredPermission.replace('_', ' ')}. 
            {permission.reason && ` Reason: ${permission.reason}`}
          </AlertDescription>
        </Alert>
      ) : null
    }
  }

  // User has required permissions, render children
  return <>{children}</>
}

// Convenience components for common permissions
export function CanApproveRequests({ children, groupId, userId, fallback }: Omit<GroupPermissionGuardProps, 'requiredPermission'>) {
  return (
    <GroupPermissionGuard
      groupId={groupId}
      userId={userId}
      requiredPermission="approve_requests"
      fallback={fallback}
    >
      {children}
    </GroupPermissionGuard>
  )
}

export function CanSendMessages({ children, groupId, userId, fallback }: Omit<GroupPermissionGuardProps, 'requiredPermission'>) {
  return (
    <GroupPermissionGuard
      groupId={groupId}
      userId={userId}
      requiredPermission="send_messages"
      fallback={fallback}
    >
      {children}
    </GroupPermissionGuard>
  )
}

export function CanEditGroup({ children, groupId, userId, fallback }: Omit<GroupPermissionGuardProps, 'requiredPermission'>) {
  return (
    <GroupPermissionGuard
      groupId={groupId}
      userId={userId}
      requiredPermission="edit_group"
      fallback={fallback}
    >
      {children}
    </GroupPermissionGuard>
  )
}

export function CanAddMembers({ children, groupId, userId, fallback }: Omit<GroupPermissionGuardProps, 'requiredPermission'>) {
  return (
    <GroupPermissionGuard
      groupId={groupId}
      userId={userId}
      requiredPermission="add_members"
      fallback={fallback}
    >
      {children}
    </GroupPermissionGuard>
  )
}

export function CanRemoveMembers({ children, groupId, userId, fallback }: Omit<GroupPermissionGuardProps, 'requiredPermission'>) {
  return (
    <GroupPermissionGuard
      groupId={groupId}
      userId={userId}
      requiredPermission="remove_members"
      fallback={fallback}
    >
      {children}
    </GroupPermissionGuard>
  )
}

export function CanViewAnalytics({ children, groupId, userId, fallback }: Omit<GroupPermissionGuardProps, 'requiredPermission'>) {
  return (
    <GroupPermissionGuard
      groupId={groupId}
      userId={userId}
      requiredPermission="view_analytics"
      fallback={fallback}
    >
      {children}
    </GroupPermissionGuard>
  )
}

export function RequiresLeadership({ children, groupId, userId, fallback }: Omit<GroupPermissionGuardProps, 'requiredPermission' | 'requiresLeadership'>) {
  return (
    <GroupPermissionGuard
      groupId={groupId}
      userId={userId}
      requiresLeadership={true}
      fallback={fallback}
    >
      {children}
    </GroupPermissionGuard>
  )
} 