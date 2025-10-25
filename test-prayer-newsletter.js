require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPrayerAndNewsletterTables() {
  console.log('🔍 Testing Prayer Requests and Newsletter Tables...\n')
  
  try {
    // Test 1: Check prayer_requests table
    console.log('1. Testing prayer_requests table...')
    const { data: prayerData, error: prayerError } = await supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (prayerError) {
      console.error('❌ Error accessing prayer_requests table:', prayerError)
    } else {
      console.log('✅ prayer_requests table accessible')
      console.log('📊 Found', prayerData?.length || 0, 'prayer requests')
      if (prayerData?.[0]) {
        console.log('📊 Sample structure:', Object.keys(prayerData[0]))
      }
      prayerData?.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.title || record.subject || 'No title'} - ${record.description || record.message || 'No description'} (${record.status})`)
      })
    }

    // Test 2: Check newsletter_subscribers table
    console.log('\n2. Testing newsletter_subscribers table...')
    const { data: newsletterData, error: newsletterError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (newsletterError) {
      console.error('❌ Error accessing newsletter_subscribers table:', newsletterError)
    } else {
      console.log('✅ newsletter_subscribers table accessible')
      console.log('📊 Found', newsletterData?.length || 0, 'newsletter subscribers')
      if (newsletterData?.[0]) {
        console.log('📊 Sample structure:', Object.keys(newsletterData[0]))
      }
      newsletterData?.forEach((record, index) => {
        const name = record.first_name && record.last_name 
          ? `${record.first_name} ${record.last_name}` 
          : record.first_name || record.name || 'No name'
        console.log(`  ${index + 1}. ${name} - ${record.email} (${record.status})`)
      })
    }

    // Test 3: Try inserting test prayer request with correct structure
    console.log('\n3. Testing prayer request insertion...')
    const prayerTestId = crypto.randomUUID()
    const { data: prayerInsertData, error: prayerInsertError } = await supabase
      .from('prayer_requests')
      .insert([{
        id: prayerTestId,
        title: 'Test Prayer Request',
        description: 'This is a test prayer request',
        status: 'new',
        urgency: 'normal',
        is_confidential: true,
        submitted_at: new Date().toISOString(),
        source: 'website'
      }])
      .select()

    if (prayerInsertError) {
      console.error('❌ Error inserting prayer request:', prayerInsertError)
    } else {
      console.log('✅ Prayer request inserted successfully!')
      // Clean up
      await supabase.from('prayer_requests').delete().eq('id', prayerTestId)
      console.log('🧹 Test prayer request cleaned up')
    }

    // Test 4: Try inserting test newsletter subscription with correct structure
    console.log('\n4. Testing newsletter subscription insertion...')
    const newsletterTestEmail = 'test-newsletter-' + Date.now() + '@test.com'
    const { data: newsletterInsertData, error: newsletterInsertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email: newsletterTestEmail,
        first_name: 'Test',
        last_name: 'Newsletter User',
        subscribed_at: new Date().toISOString(),
        status: 'active',
        subscription_source: 'contact_form'
      }])
      .select()

    if (newsletterInsertError) {
      console.error('❌ Error inserting newsletter subscription:', newsletterInsertError)
    } else {
      console.log('✅ Newsletter subscription inserted successfully!')
      // Clean up
      await supabase.from('newsletter_subscribers').delete().eq('email', newsletterTestEmail)
      console.log('🧹 Test newsletter subscription cleaned up')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testPrayerAndNewsletterTables() 