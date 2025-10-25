const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addRealPushToken() {
  console.log('🔧 Adding a real-format push token for testing...')
  
  const userId = '3f66df8b-68a0-4de9-a4e5-068c01a5f3ce'
  
  // This is a real format token (but still for testing - replace with actual token from your device)
  const realFormatToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
  
  try {
    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('mobile_app_users')
      .select('devices')
      .eq('auth_user_id', userId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError)
      return
    }

    // Add new device with real token format
    const newDevice = {
      push_token: realFormatToken,
      platform: 'ios',
      active: true,
      registered_at: new Date().toISOString(),
      device_info: {
        deviceName: 'iPhone (Real Token)',
        osName: 'iOS',
        osVersion: '17.0',
        modelName: 'iPhone'
      }
    }

    const updatedDevices = [...(currentUser.devices || []), newDevice]

    // Update user with new device
    const { error: updateError } = await supabase
      .from('mobile_app_users')
      .update({ devices: updatedDevices })
      .eq('auth_user_id', userId)

    if (updateError) {
      console.error('❌ Error updating devices:', updateError)
      return
    }

    console.log('✅ Added real-format push token!')
    console.log('📱 Token:', realFormatToken)
    
    // Test the notification
    console.log('\n🧪 Testing push notification...')
    
    const response = await fetch('http://localhost:3003/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: [userId],
        title: 'Real Token Test',
        body: 'Testing with real token format'
      })
    })

    const result = await response.json()
    console.log('📤 Push notification result:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the script
addRealPushToken() 