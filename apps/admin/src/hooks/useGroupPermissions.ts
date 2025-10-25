import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type GroupPermission = {
  hasPermission: boolean
  reason: string
  isLoading: boolean
}

export function useGroupPermissions(groupId: string | null, userId: string | null) {
  const [isGroupLeader, setIsGroupLeader] = useState<boolean>(false)
  const [permissions, setPermissions] = useState<Record<string, GroupPermission>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId || !userId) {
      setLoading(false)
      return
    }

    const checkPermissions = async () => {
      try {
        setLoading(true)

        // Check if user is a leader
        const { data: leaderData, error: leaderError } = await supabase
          .from('group_leaders')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single()

        const isLeader = !leaderError && !!leaderData
        setIsGroupLeader(isLeader)

        // Check specific permissions
        const permissionTypes = [
          'approve_requests',
          'send_messages',
          'edit_group',
          'add_members',
          'remove_members',
          'view_analytics'
        ]

        const response = await fetch('/api/admin/check-group-permission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_id: groupId,
            user_id: userId,
            permissions: permissionTypes
          })
        })

        if (response.ok) {
          const data = await response.json()
          const permissionsWithLoading: Record<string, GroupPermission> = {}
          
          Object.entries(data.permissions).forEach(([key, value]: [string, any]) => {
            permissionsWithLoading[key] = {
              hasPermission: value.hasPermission,
              reason: value.reason,
              isLoading: false
            }
          })
          
          setPermissions(permissionsWithLoading)
        } else {
          // Set default permissions if API fails
          const defaultPermissions: Record<string, GroupPermission> = {}
          permissionTypes.forEach(type => {
            defaultPermissions[type] = {
              hasPermission: false,
              reason: 'Permission check failed',
              isLoading: false
            }
          })
          setPermissions(defaultPermissions)
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        setIsGroupLeader(false)
        setPermissions({})
      } finally {
        setLoading(false)
      }
    }

    checkPermissions()
  }, [groupId, userId])

  const hasPermission = (permissionType: string): boolean => {
    return permissions[permissionType]?.hasPermission || false
  }

  const getPermission = (permissionType: string): GroupPermission => {
    return permissions[permissionType] || {
      hasPermission: false,
      reason: 'Permission not found',
      isLoading: true
    }
  }

  const canApproveRequests = hasPermission('approve_requests')
  const canSendMessages = hasPermission('send_messages')
  const canEditGroup = hasPermission('edit_group')
  const canAddMembers = hasPermission('add_members')
  const canRemoveMembers = hasPermission('remove_members')
  const canViewAnalytics = hasPermission('view_analytics')

  return {
    isGroupLeader,
    permissions,
    loading,
    hasPermission,
    getPermission,
    canApproveRequests,
    canSendMessages,
    canEditGroup,
    canAddMembers,
    canRemoveMembers,
    canViewAnalytics
  }
} 