require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Test notification settings functionality
async function testNotifications() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔍 Testing Notification Settings...')
  console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
  console.log('Service Key:', supabaseKey ? 'Found' : 'Missing')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test 1: Check if notification tables exist
    console.log('\n📋 Testing table existence...')
    
    const tables = [
      'notification_settings',
      'notification_types', 
      'notification_type_settings',
      'role_notification_preferences'
    ]

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Table exists`)
      }
    }

    // Test 2: Try to fetch global settings
    console.log('\n⚙️ Testing global settings...')
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .single()

    if (settingsError && settingsError.code === 'PGRST116') {
      console.log('📝 No global settings found (using defaults)')
    } else if (settingsError) {
      console.log(`❌ Settings error: ${settingsError.message}`)
    } else {
      console.log('✅ Global settings found:', {
        email: settings.email_enabled,
        sms: settings.sms_enabled, 
        push: settings.push_enabled,
        inApp: settings.in_app_enabled
      })
    }

    // Test 3: Check notification types
    console.log('\n🔔 Testing notification types...')
    const { data: types, error: typesError } = await supabase
      .from('notification_types')
      .select('id, name, category')
      .limit(5)

    if (typesError) {
      console.log(`❌ Types error: ${typesError.message}`)
    } else {
      console.log(`✅ Found ${types?.length || 0} notification types:`)
      types?.forEach(type => {
        console.log(`   - ${type.name} (${type.category})`)
      })
    }

    // Test 4: Try saving a test setting
    console.log('\n💾 Testing save functionality...')
    const testData = {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
      digest_mode_enabled: false,
      digest_frequency: 'daily',
      digest_time: '09:00:00'
    }

    const { error: saveError } = await supabase
      .from('notification_settings')
      .upsert(testData)

    if (saveError) {
      console.log(`❌ Save error: ${saveError.message}`)
    } else {
      console.log('✅ Settings save successful')
    }

    console.log('\n🎉 Notification settings test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testNotifications() 