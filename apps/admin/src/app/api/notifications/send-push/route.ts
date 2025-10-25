import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface PushNotificationPayload {
  to: string | string[]
  title: string
  body: string
  data?: any
  sound?: string
  badge?: number
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userIds, 
      title, 
      body, 
      type = 'general',
      data = {},
      sound = 'default',
      badge 
    } = await request.json()
    
    if (!userIds || !title || !body) {
      return NextResponse.json(
        { success: false, error: 'userIds, title, and body are required' },
        { status: 400 }
      )
    }

    console.log('📱 Sending push notifications to users:', userIds)

    // Get mobile users with their devices (which contain push tokens)
    const { data: mobileUsers, error: usersError } = await supabaseAdmin
      .from('mobile_app_users')
      .select('auth_user_id, devices')
      .in('auth_user_id', Array.isArray(userIds) ? userIds : [userIds])

    if (usersError) {
      console.error('❌ Error getting mobile users:', usersError)
      return NextResponse.json(
        { success: false, error: usersError.message },
        { status: 500 }
      )
    }

    if (!mobileUsers || mobileUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No mobile users found' },
        { status: 404 }
      )
    }

    // Extract push tokens from devices and create messages
    const messages: any[] = []
    const activeUsers: any[] = []

    mobileUsers.forEach(user => {
      const devices = Array.isArray(user.devices) ? user.devices : []
      const pushTokens = devices.filter(device => device.push_token).map(device => device.push_token)
      
      if (pushTokens.length > 0) {
        activeUsers.push(user)
        
        // Create a message for each push token (user might have multiple devices)
        pushTokens.forEach(pushToken => {
          messages.push({
            to: pushToken,
            title,
            body,
            data: {
              type,
              userId: user.auth_user_id,
              ...data
            },
            sound,
            badge
          })
        })
      }
    })

    if (messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found with push tokens' },
        { status: 404 }
      )
    }

    // Send notifications using Expo Push API
    const results = await sendExpoPushNotifications(messages)

    // Log notification sends to database (optional)
    try {
      const notificationLogs = activeUsers.map(user => ({
        user_id: user.auth_user_id,
        type,
        title,
        body,
        data: { type, ...data },
        sent_at: new Date().toISOString(),
        status: 'sent'
      }))

      await supabaseAdmin
        .from('notification_logs')
        .insert(notificationLogs)
    } catch (logError) {
      console.warn('⚠️ Failed to log notifications:', logError)
      // Don't fail the request if logging fails
    }

    console.log('✅ Push notifications sent successfully')

    return NextResponse.json({
      success: true,
      message: `Push notifications sent to ${activeUsers.length} users`,
      sentCount: activeUsers.length,
      totalUsers: mobileUsers.length,
      results
    })

  } catch (error) {
    console.error('❌ Error sending push notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendExpoPushNotifications(messages: PushNotificationPayload[]): Promise<any[]> {
  const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN
  
  if (!EXPO_ACCESS_TOKEN) {
    console.warn('⚠️ EXPO_ACCESS_TOKEN not configured, simulating push notifications')
    return messages.map(() => ({ status: 'ok', id: 'simulated-' + Date.now() }))
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(messages)
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Expo API error: ${result.message || 'Unknown error'}`)
    }

    return result.data || []
  } catch (error) {
    console.error('❌ Error calling Expo Push API:', error)
    throw error
  }
} 