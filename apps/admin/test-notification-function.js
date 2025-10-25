// Test notification settings using the same structure as the app
const path = require('path')

// Set NODE_ENV to development to match the app
process.env.NODE_ENV = 'development'

// Test if we can import and use the notification functions
async function testNotificationSettings() {
  console.log('🔍 Testing Notification Settings Functions...')
  
  try {
    // Try to load environment from Next.js config
    const { loadEnvConfig } = require('@next/env')
    const projectDir = process.cwd()
    loadEnvConfig(projectDir)
    
    console.log('📋 Environment check:')
    console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found ✅' : 'Missing ❌')
    console.log('- Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found ✅' : 'Missing ❌')
    console.log('- Node ENV:', process.env.NODE_ENV)
    
    // Test if we can import the notification service
    console.log('\n📦 Testing module imports...')
    
    // Import the notification functions
    const notificationService = require('./src/services/notifications')
    console.log('- Notification service imported ✅')
    
    // Test fetch global settings
    console.log('\n⚙️ Testing fetchGlobalSettings...')
    const { data: settings, error } = await notificationService.fetchGlobalSettings()
    
    if (error) {
      console.log('❌ Error fetching settings:', error)
    } else if (settings) {
      console.log('✅ Settings loaded:', {
        email: settings.emailEnabled,
        sms: settings.smsEnabled,
        push: settings.pushEnabled,
        inApp: settings.inAppEnabled
      })
    } else {
      console.log('📝 No settings found (using defaults)')
    }
    
    // Test notification types
    console.log('\n🔔 Testing notification types...')
    const { data: types, error: typesError } = await notificationService.fetchNotificationTypes()
    
    if (typesError) {
      console.log('❌ Error fetching types:', typesError)
    } else {
      console.log(`✅ Found ${types?.length || 0} notification types`)
      if (types && types.length > 0) {
        types.slice(0, 3).forEach(type => {
          console.log(`   - ${type.name} (${type.category})`)
        })
      }
    }
    
    // Test saving default settings
    console.log('\n💾 Testing save functionality...')
    const defaultSettings = notificationService.getDefaultGlobalSettings()
    const { success, error: saveError } = await notificationService.saveGlobalSettings(defaultSettings)
    
    if (saveError) {
      console.log('❌ Save error:', saveError)
    } else if (success) {
      console.log('✅ Settings saved successfully')
    }
    
    console.log('\n🎉 Notification settings test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testNotificationSettings() 