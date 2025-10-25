require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRLSPolicies() {
  console.log('🔍 Testing RLS Policies and Permissions...\n')
  
  try {
    // Test 1: Direct insert into prayer_requests with service role key
    console.log('1. Testing prayer_requests RLS policies...')
    
    const testPrayerId = crypto.randomUUID()
    const { data: prayerData, error: prayerError } = await supabase
      .from('prayer_requests')
      .insert([{
        id: testPrayerId,
        contact_id: crypto.randomUUID(),
        title: 'RLS Test Prayer',
        description: 'Testing RLS policies',
        status: 'new',
        urgency: 'normal',
        is_confidential: true,
        source: 'website',
        submitted_at: new Date().toISOString()
      }])
      .select()

    if (prayerError) {
      console.error('❌ Prayer request RLS blocked:', prayerError)
      
      // Check if it's an RLS error
      if (prayerError.message?.includes('row-level security') || prayerError.code === 'PGRST116') {
        console.error('🚫 RLS Policy is blocking prayer_requests inserts!')
      }
    } else {
      console.log('✅ Prayer request insert succeeded with service role')
      // Clean up
      await supabase.from('prayer_requests').delete().eq('id', testPrayerId)
      console.log('🧹 Test prayer cleaned up')
    }

    // Test 2: Direct insert into newsletter_subscribers with service role key
    console.log('\n2. Testing newsletter_subscribers RLS policies...')
    
    const testEmail = 'rls-test-' + Date.now() + '@test.com'
    const { data: newsletterData, error: newsletterError } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email: testEmail,
        first_name: 'RLS',
        last_name: 'Test',
        status: 'active',
        subscription_source: 'contact_form',
        subscribed_at: new Date().toISOString()
      }])
      .select()

    if (newsletterError) {
      console.error('❌ Newsletter subscription RLS blocked:', newsletterError)
      
      // Check if it's an RLS error
      if (newsletterError.message?.includes('row-level security') || newsletterError.code === 'PGRST116') {
        console.error('🚫 RLS Policy is blocking newsletter_subscribers inserts!')
      }
    } else {
      console.log('✅ Newsletter insert succeeded with service role')
      // Clean up
      await supabase.from('newsletter_subscribers').delete().eq('email', testEmail)
      console.log('🧹 Test newsletter cleaned up')
    }

    // Test 3: Check table permissions and policies
    console.log('\n3. Checking table permissions...')
    
    // This will show us what policies exist
    const { data: policyData, error: policyError } = await supabase.rpc('exec', {
      sql: `
        SELECT schemaname, tablename, policyname, roles, cmd, qual 
        FROM pg_policies 
        WHERE tablename IN ('prayer_requests', 'newsletter_subscribers');
      `
    }).catch(() => {
      // Ignore if this RPC doesn't exist
      return { data: null, error: { message: 'RPC not available' } }
    })

    if (policyError && !policyError.message?.includes('not available')) {
      console.error('❌ Could not fetch policies:', policyError)
    } else if (policyData) {
      console.log('📊 RLS Policies found:')
      policyData.forEach(policy => {
        console.log(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('📊 Could not fetch RLS policies (RPC not available)')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testRLSPolicies() 