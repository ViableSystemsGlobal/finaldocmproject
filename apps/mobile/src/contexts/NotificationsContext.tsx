import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { pushNotificationService, NotificationPreferences, defaultNotificationPreferences } from '../services/pushNotifications'
import { useAuth } from './AuthContext'

interface Notification {
  id: string
  type: 'event' | 'sermon' | 'announcement' | 'prayer' | 'group' | 'general'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionData?: any
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  updatePreferences: (newPreferences: NotificationPreferences) => Promise<boolean>
  refreshNotifications: () => Promise<void>
  sendTestNotification: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (user && !initialized) {
      initializeNotifications()
      setInitialized(true)
    }
  }, [user, initialized])

  const initializeNotifications = async () => {
    if (!user) return

    try {
      console.log('🔔 Initializing notifications for user:', user.id)

      // Initialize push notification service
      const pushInitialized = await pushNotificationService.initialize(user.id)
      if (pushInitialized) {
        console.log('✅ Push notifications initialized')
      }

      // Load notification preferences
      await loadPreferences()

      // Load existing notifications
      await loadNotifications()

      // Set up real-time subscription for new notifications
      setupRealtimeSubscription()

    } catch (error) {
      console.error('❌ Error initializing notifications:', error)
    }
  }

  const loadPreferences = async () => {
    if (!user) return

    try {
      const userPreferences = await pushNotificationService.getPreferences(user.id)
      if (userPreferences) {
        setPreferences(userPreferences)
      }
    } catch (error) {
      console.error('❌ Error loading notification preferences:', error)
    }
  }

  const loadNotifications = async () => {
    if (!user) return

    try {
      // For now, we'll use mock data, but this could be replaced with real data from Supabase
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'event',
          title: 'New Event: Annual Church Picnic',
          message: 'Join us for food, fellowship, and fun at Riverside Park this Sunday!',
          timestamp: formatTimestamp(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
          read: false,
          actionData: { eventId: 'event-1' }
        },
        {
          id: '2',
          type: 'sermon',
          title: 'New Sermon Available',
          message: 'Pastor John\'s latest message "Walking in Faith" is now available.',
          timestamp: formatTimestamp(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
          read: false,
          actionData: { sermonId: 'sermon-1' }
        },
        {
          id: '3',
          type: 'announcement',
          title: 'Church Updates',
          message: 'Important updates about upcoming service changes and new programs.',
          timestamp: formatTimestamp(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
          read: true,
        },
        {
          id: '4',
          type: 'prayer',
          title: 'Prayer Request Update',
          message: 'Thank you for your prayers! Mrs. Johnson is recovering well.',
          timestamp: formatTimestamp(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
          read: true,
        },
        {
          id: '5',
          type: 'group',
          title: 'Youth Group Meeting',
          message: 'Don\'t forget about youth group this Friday at 7 PM.',
          timestamp: formatTimestamp(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 1 week ago
          read: true,
          actionData: { groupId: 'group-1' }
        },
      ]
      
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('❌ Error loading notifications:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    // Subscribe to real-time notifications (this would be implemented based on your notification system)
    console.log('🔄 Setting up real-time notification subscription for user:', user.id)
    
    // Example: Subscribe to events that might trigger notifications
    const eventsSubscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'events',
        }, 
        (payload) => {
          console.log('📅 New event created:', payload)
          // Create notification for new event
          if (preferences.events) {
            addNotification({
              type: 'event',
              title: 'New Event Added',
              message: `${payload.new.name} has been scheduled`,
              timestamp: formatTimestamp(new Date()),
              read: false,
              actionData: { eventId: payload.new.id }
            })
          }
        }
      )
      .subscribe()

    // Subscribe to prayer requests
    const prayersSubscription = supabase
      .channel('prayer-notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prayer_requests',
        },
        (payload) => {
          console.log('🙏 New prayer request:', payload)
          if (preferences.prayers) {
            addNotification({
              type: 'prayer',
              title: 'New Prayer Request',
              message: 'A new prayer request has been submitted',
              timestamp: formatTimestamp(new Date()),
              read: false,
              actionData: { prayerId: payload.new.id }
            })
          }
        }
      )
      .subscribe()

    return () => {
      eventsSubscription.unsubscribe()
      prayersSubscription.unsubscribe()
    }
  }

  const formatTimestamp = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
    
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const addNotification = (newNotification: Omit<Notification, 'id'>) => {
    const notification: Notification = {
      ...newNotification,
      id: Date.now().toString(),
    }
    setNotifications(prev => [notification, ...prev])
  }

  const updatePreferences = async (newPreferences: NotificationPreferences): Promise<boolean> => {
    if (!user) return false

    try {
      const success = await pushNotificationService.updatePreferences(user.id, newPreferences)
      if (success) {
        setPreferences(newPreferences)
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error updating preferences:', error)
      return false
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications()
  }

  const sendTestNotification = async () => {
    try {
      await pushNotificationService.sendLocalNotification({
        type: 'general',
        title: 'Test Notification',
        body: 'This is a test notification from your church app!',
        data: { test: true }
      })
      
      // Also add to local notifications
      addNotification({
        type: 'general',
        title: 'Test Notification',
        message: 'This is a test notification from your church app!',
        timestamp: formatTimestamp(new Date()),
        read: false,
      })
    } catch (error) {
      console.error('❌ Error sending test notification:', error)
    }
  }

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      preferences,
      markAsRead,
      markAllAsRead,
      addNotification,
      updatePreferences,
      refreshNotifications,
      sendTestNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
} 