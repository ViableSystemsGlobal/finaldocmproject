// Load environment variables from .env.local first
require('dotenv').config({ path: './apps/admin/.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

let lastTokenCount = 0
let lastTokens = []

async function checkForNewTokens() {
  try {
    const { data: user, error } = await supabase
      .from('mobile_app_users')
      .select('devices')
      .eq('auth_user_id', '3f66df8b-68a0-4de9-a4e5-068c01a5f3ce')
      .single()

    if (error) {
      console.error('❌ Error fetching user:', error)
      return
    }

    const devices = user.devices || []
    const currentTokenCount = devices.length
    
    if (currentTokenCount !== lastTokenCount) {
      console.log(`\n🔄 Token count changed: ${lastTokenCount} → ${currentTokenCount}`)
      
      // Show all tokens
      devices.forEach((device, index) => {
        const isNew = !lastTokens.includes(device.push_token)
        const status = isNew ? '🆕 NEW' : '📱'
        const tokenType = device.push_token.includes('TEST') || device.push_token.includes('xxxxxx') ? '❌ FAKE' : '✅ REAL'
        
        console.log(`${status} Device ${index + 1}: ${tokenType}`)
        console.log(`   Token: ${device.push_token}`)
        console.log(`   Platform: ${device.platform}`)
        console.log(`   Registered: ${device.registered_at}`)
        
        if (isNew && !device.push_token.includes('TEST') && !device.push_token.includes('xxxxxx')) {
          console.log('\n🎉 REAL TOKEN DETECTED! Testing notification...')
          testNotification(device.push_token)
        }
      })
      
      lastTokenCount = currentTokenCount
      lastTokens = devices.map(d => d.push_token)
    }
    
  } catch (error) {
    console.error('❌ Error checking tokens:', error)
  }
}

async function testNotification(token) {
  try {
    const response = await fetch('http://localhost:3003/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: ['3f66df8b-68a0-4de9-a4e5-068c01a5f3ce'],
        title: 'Real Token Test! 🎉',
        body: 'You should receive this notification!'
      })
    })

    const result = await response.json()
    if (result.results && result.results[0]) {
      const firstResult = result.results[0]
      if (firstResult.status === 'ok') {
        console.log('✅ SUCCESS! Notification sent to real device!')
      } else {
        console.log('⚠️ Notification failed:', firstResult.message)
      }
    }
  } catch (error) {
    console.error('❌ Error testing notification:', error)
  }
}

console.log('👀 Monitoring for new push tokens...')
console.log('📱 Open your mobile app and login to register a new token')
console.log('🔄 Checking every 3 seconds...\n')

// Check immediately
checkForNewTokens()

// Then check every 3 seconds
setInterval(checkForNewTokens, 3000) 