// Test script to verify contact lookup functionality
const { createClient } = require('@supabase/supabase-js')

// Use environment variables or fallback to localhost
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testContactLookup() {
  console.log('🧪 Testing contact lookup functionality...')
  
  try {
    // Test 1: Check mobile_app_users table structure
    console.log('\n📋 Test 1: Checking mobile_app_users table...')
    const { data: mobileUsers, error: mobileError } = await supabase
      .from('mobile_app_users')
      .select('id, auth_user_id, contact_id, status')
      .limit(5)
    
    if (mobileError) {
      console.error('❌ Error querying mobile_app_users:', mobileError)
    } else {
      console.log('✅ Mobile app users found:', mobileUsers.length)
      mobileUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Auth User: ${user.auth_user_id}, Contact: ${user.contact_id}`)
      })
    }
    
    // Test 2: Check contacts table
    console.log('\n📋 Test 2: Checking contacts table...')
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name')
      .limit(5)
    
    if (contactsError) {
      console.error('❌ Error querying contacts:', contactsError)
    } else {
      console.log('✅ Contacts found:', contacts.length)
      contacts.forEach(contact => {
        console.log(`  - ID: ${contact.id}, Email: ${contact.email}, Name: ${contact.first_name} ${contact.last_name}`)
      })
    }
    
    // Test 3: Test the specific user ID that was failing
    const testUserId = '74333f31-c9f7-418d-8dee-d92449c5347e'
    console.log(`\n📋 Test 3: Testing specific user ID: ${testUserId}`)
    
    const { data: specificUser, error: specificError } = await supabase
      .from('mobile_app_users')
      .select('id, auth_user_id, contact_id, status')
      .eq('auth_user_id', testUserId)
      .single()
    
    if (specificError) {
      console.error('❌ Error finding specific user:', specificError)
    } else {
      console.log('✅ Found specific user:', specificUser)
    }
    
    console.log('\n🎯 Contact lookup test completed!')
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error)
  }
}

testContactLookup() 