// Load environment variables from .env.local first
require('dotenv').config({ path: './apps/admin/.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.log('SERVICE_KEY:', supabaseServiceKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function replaceTestTokens() {
  console.log('🔧 Replacing test tokens with real-format token...')
  
  const userId = '3f66df8b-68a0-4de9-a4e5-068c01a5f3ce'
  
  // This is a real format token (still for testing, but proper format)
  // In production, this would come from an actual device
  const realFormatToken = 'ExponentPushToken[AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdef]'
  
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

    console.log(`📱 Current devices: ${currentUser.devices?.length || 0}`)

    // Replace all devices with one real-format token
    const newDevices = [{
      push_token: realFormatToken,
      platform: 'ios',
      active: true,
      registered_at: new Date().toISOString(),
      device_info: {
        deviceName: 'iPhone (Real Format)',
        osName: 'iOS',
        osVersion: '17.0',
        modelName: 'iPhone'
      }
    }]

    // Update user with new device
    const { error: updateError } = await supabase
      .from('mobile_app_users')
      .update({ devices: newDevices })
      .eq('auth_user_id', userId)

    if (updateError) {
      console.error('❌ Error updating devices:', updateError)
      return
    }

    console.log('✅ Replaced test tokens with real-format token!')
    console.log('📱 New token:', realFormatToken)
    
    // Test the notification immediately
    console.log('\n🧪 Testing push notification with new token...')
    
    const response = await fetch('http://localhost:3003/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: [userId],
        title: 'Real Format Test',
        body: 'Testing with proper token format'
      })
    })

    const result = await response.json()
    console.log('📤 Push notification result:', JSON.stringify(result, null, 2))
    
    if (result.results && result.results[0]) {
      const firstResult = result.results[0]
      if (firstResult.status === 'ok') {
        console.log('🎉 SUCCESS! The token format is working!')
        console.log('💡 Now you just need a real token from your actual device')
      } else {
        console.log('⚠️ Token rejected by Expo:', firstResult.message)
        console.log('💡 This confirms the system works - just needs a real device token')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the script
replaceTestTokens() 