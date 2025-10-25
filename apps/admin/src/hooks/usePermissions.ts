'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCurrentUserPermissions, type UserPermissions } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'

export function usePermissions() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    user: null,
    roles: [],
    permissions: [],
    department: undefined
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = useCallback(async () => {
    try {
      setIsLoading(true)
              setError(null)
        const permissions = await getCurrentUserPermissions()
        setUserPermissions(permissions)
    } catch (err) {
      console.error('Error loading permissions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
      setUserPermissions({ user: null, roles: [], permissions: [], department: undefined })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPermissions()

    // Listen for auth changes to reload permissions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadPermissions()
      } else if (event === 'SIGNED_OUT') {
        setUserPermissions({
          user: null,
          roles: [],
          permissions: [],
          department: undefined
        })
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadPermissions])

  return {
    userPermissions,
    isLoading,
    error,
    reload: loadPermissions
  }
} 