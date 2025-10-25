import { useState, useEffect, useCallback } from 'react'
import { getCurrentTenantSettings, TenantSettings } from '@/services/settings'

export function useTenantSettings() {
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const tenantSettings = await getCurrentTenantSettings()
      setSettings(tenantSettings)
    } catch (err) {
      console.error('Failed to load tenant settings:', err)
      setError('Failed to load tenant settings')
      // Set default settings on error
      setSettings({
        id: '',
        name: 'Mobile App Admin',
        time_zone: 'America/New_York',
        primary_color: '#1A202C',
        secondary_color: '#F6E05E',
        logo_url: '/mobile-app-icon.png',
        created_at: '',
        updated_at: ''
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Create a refresh function that can be called from outside
  const refresh = useCallback(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    refresh,
    churchName: settings?.name || 'Mobile App Admin',
    logoUrl: settings?.logo_url || '/mobile-app-icon.png',
    primaryColor: settings?.primary_color || '#1A202C',
    secondaryColor: settings?.secondary_color || '#F6E05E'
  }
} 