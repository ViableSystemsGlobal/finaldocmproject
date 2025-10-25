import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, pushToken, platform, deviceInfo } = await request.json()
    
    if (!userId || !pushToken) {
      return NextResponse.json(
        { success: false, error: 'userId and pushToken are required' },
        { status: 400 }
      )
    }

    console.log('📱 Registering push token for user:', userId)

    // First, get the current user record to update devices array
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('mobile_app_users')
      .select('devices')
      .eq('auth_user_id', userId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching mobile app user:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    // Create new device entry
    const newDevice = {
      push_token: pushToken,
      platform: platform || 'unknown',
      device_info: deviceInfo || {},
      registered_at: new Date().toISOString(),
      active: true
    }

    // Update devices array - replace if token exists, add if new
    let devices = currentUser?.devices || []
    const existingDeviceIndex = devices.findIndex((device: any) => 
      device.push_token === pushToken || 
      (device.device_info?.deviceName && deviceInfo?.deviceName && 
       device.device_info.deviceName === deviceInfo.deviceName)
    )

    if (existingDeviceIndex >= 0) {
      // Update existing device
      devices[existingDeviceIndex] = newDevice
      console.log('🔄 Updated existing device token')
    } else {
      // Add new device
      devices.push(newDevice)
      console.log('➕ Added new device token')
    }

    // Update the mobile app user record with updated devices array
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('mobile_app_users')
      .update({
        devices: devices,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating mobile app user:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Push token registered successfully for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Push token registered successfully',
      user: updatedUser,
      deviceCount: devices.length
    })

  } catch (error) {
    console.error('❌ Error registering push token:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 