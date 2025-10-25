import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log('📱 Getting notification preferences for user:', userId)

    // Get notification preferences from mobile app user record
    const { data: mobileUser, error: userError } = await supabaseAdmin
      .from('mobile_app_users')
      .select('notification_preferences')
      .eq('auth_user_id', userId)
      .single()

    if (userError) {
      console.error('❌ Error getting mobile app user:', userError)
      return NextResponse.json(
        { success: false, error: userError.message },
        { status: 500 }
      )
    }

    // Return preferences or defaults
    const preferences = mobileUser?.notification_preferences || {
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

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('❌ Error getting notification preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json()
    
    if (!userId || !preferences) {
      return NextResponse.json(
        { success: false, error: 'userId and preferences are required' },
        { status: 400 }
      )
    }

    console.log('📱 Updating notification preferences for user:', userId)

    // Update notification preferences in mobile app user record
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('mobile_app_users')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating notification preferences:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Notification preferences updated successfully for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: updatedUser.notification_preferences
    })

  } catch (error) {
    console.error('❌ Error updating notification preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 