import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { getAdminApiUrl } from '../config/environment'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export interface PushNotificationData {
  type: 'event' | 'sermon' | 'announcement' | 'prayer' | 'group' | 'general'
  title: string
  body: string
  data?: any
}

export interface NotificationPreferences {
  events: boolean
  sermons: boolean
  announcements: boolean
  prayers: boolean
  groups: boolean
  general: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

class PushNotificationService {
  private expoPushToken: string | null = null
  private notificationListener: any = null
  private responseListener: any = null

  /**
   * Initialize push notifications
   */
  async initialize(userId?: string): Promise<boolean> {
    try {
      console.log('🔔 Initializing push notifications...')

      // Check if device supports push notifications
      // Note: Expo Go on real devices can handle push notifications, so we'll try regardless
      if (!Device.isDevice) {
        console.warn('⚠️ Running in simulator - push notifications may not work fully')
      }

      // Request permissions (even in Expo Go on real devices)
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Push notification permissions not granted')
        // Still set up listeners for local notifications
        this.setupNotificationListeners()
        return false
      }

      // Try to get push token - this might fail in development without proper Expo project setup
      try {
        console.log('🔑 Attempting to get Expo push token...')
        const tokenData = await Notifications.getExpoPushTokenAsync()
        
        if (tokenData?.data) {
          this.expoPushToken = tokenData.data
          console.log('✅ Got Expo push token:', this.expoPushToken)

          // Register token with backend if user is provided
          if (userId && this.expoPushToken) {
            await this.registerTokenWithBackend(userId, this.expoPushToken)
          }
        }
      } catch (tokenError) {
        console.warn('⚠️ Could not get Expo push token (this is normal in development):', tokenError)
        // Continue without push token - local notifications will still work
        this.expoPushToken = null
      }

      // Set up notification listeners
      this.setupNotificationListeners()

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels()
      }

      console.log('✅ Push notification service initialized')
      return true
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error)
      // Still try to set up basic listeners
      try {
        this.setupNotificationListeners()
      } catch (listenerError) {
        console.error('❌ Failed to set up notification listeners:', listenerError)
      }
      return false
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('events', {
      name: 'Events',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'Announcements',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('prayers', {
      name: 'Prayer Requests',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#F59E0B',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#F59E0B',
      sound: 'default',
    })
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners() {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification)
      this.handleNotificationReceived(notification)
    })

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response)
      this.handleNotificationResponse(response)
    })
  }

  /**
   * Handle notification received while app is open
   */
  private handleNotificationReceived(notification: Notifications.Notification) {
    // Add to local notification store
    const notificationData = {
      id: notification.request.identifier,
      type: notification.request.content.data?.type || 'general',
      title: notification.request.content.title || '',
      message: notification.request.content.body || '',
      timestamp: new Date().toISOString(),
      read: false,
      actionData: notification.request.content.data
    }

    // You can dispatch this to your notification context
    // or handle it however you prefer
    console.log('📱 Adding notification to local store:', notificationData)
  }

  /**
   * Handle notification tap/interaction
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as any
    
    // Handle navigation based on notification type
    if (data?.type && data?.actionData) {
      this.handleNotificationNavigation(data.type as string, data.actionData)
    }
  }

  /**
   * Handle navigation based on notification type
   */
  private handleNotificationNavigation(type: string, actionData: any) {
    // This would typically use your navigation service
    console.log('🧭 Handling navigation for notification:', { type, actionData })
    
    switch (type) {
      case 'event':
        // Navigate to event details
        if (actionData.eventId) {
          // navigation.navigate('EventDetails', { eventId: actionData.eventId })
        }
        break
      case 'sermon':
        // Navigate to sermon
        if (actionData.sermonId) {
          // navigation.navigate('SermonDetails', { sermonId: actionData.sermonId })
        }
        break
      case 'prayer':
        // Navigate to prayer requests
        // navigation.navigate('PrayerRequests')
        break
      case 'group':
        // Navigate to groups
        // navigation.navigate('Groups')
        break
      default:
        // Navigate to notifications screen
        // navigation.navigate('Notifications')
        break
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(userId: string, pushToken: string): Promise<boolean> {
    try {
      console.log('📡 Registering push token with backend...')

      const adminUrl = getAdminApiUrl()
      const response = await fetch(`${adminUrl}/api/mobile-users/register-push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          pushToken,
          platform: Platform.OS,
          deviceInfo: {
            deviceName: Device.deviceName,
            osName: Device.osName,
            osVersion: Device.osVersion,
            modelName: Device.modelName,
          }
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Push token registered successfully')
        return true
      } else {
        console.error('❌ Failed to register push token:', result.error)
        return false
      }
    } catch (error) {
      console.error('❌ Error registering push token:', error)
      return false
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const adminUrl = getAdminApiUrl()
      console.log('🔍 Getting notification preferences from:', `${adminUrl}/api/mobile-users/notification-preferences?userId=${userId}`)
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${adminUrl}/api/mobile-users/notification-preferences?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Successfully retrieved notification preferences')
        return result.preferences
      } else {
        throw new Error(result.error || 'Failed to get preferences')
      }
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error)
      
      // Check if it's a timeout or network error
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        console.log('⏱️ Request timed out - admin server may not be running')
      } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        if (error.message.includes('Network request failed') || error.message.includes('timeout')) {
          console.log('🌐 Network error - admin server may not be accessible')
        }
      }
      
      // Return default preferences as fallback
      console.log('🔄 Using default notification preferences as fallback')
      return {
        events: true,
        sermons: true,
        announcements: true,
        prayers: true,
        groups: true,
        general: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      }
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: NotificationPreferences): Promise<boolean> {
    try {
      const adminUrl = getAdminApiUrl()
      console.log('📝 Updating notification preferences at:', `${adminUrl}/api/mobile-users/notification-preferences`)
      
      const response = await fetch(`${adminUrl}/api/mobile-users/notification-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          preferences
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Successfully updated notification preferences')
        return true
      } else {
        throw new Error(result.error || 'Failed to update preferences')
      }
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error)
      
      // For now, return false but don't crash the app
      // In a production app, you might want to queue this for retry later
      return false
    }
  }

  /**
   * Send a local notification (for testing)
   */
  async sendLocalNotification(data: PushNotificationData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: { type: data.type, ...(data.data || {}) },
          sound: 'default',
        },
        trigger: null, // Send immediately
      })
    } catch (error) {
      console.error('❌ Error sending local notification:', error)
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync()
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    const notifications = await Notifications.getPresentedNotificationsAsync()
    return notifications.length
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener)
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener)
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

// Export default preferences
export const defaultNotificationPreferences: NotificationPreferences = {
  events: true,
  sermons: true,
  announcements: true,
  prayers: true,
  groups: true,
  general: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
} 