require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkNewsletterCount() {
  console.log('📊 Detailed Newsletter Subscriber Analysis\n')
  
  // Get total count
  const { count, error: countError } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('❌ Error getting count:', countError)
    return
  }
  
  console.log(`📈 Total newsletter subscribers: ${count}`)
  
  // Get all records with detailed info
  const { data: allData, error: allError } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (allError) {
    console.error('❌ Error getting all records:', allError)
    return
  }
  
  console.log(`📋 Found ${allData?.length || 0} records:`)
  console.log('─'.repeat(80))
  
  allData?.forEach((record, index) => {
    const name = record.first_name && record.last_name 
      ? `${record.first_name} ${record.last_name}` 
      : record.first_name || 'No name'
    
    console.log(`${index + 1}. ${name}`)
    console.log(`   📧 Email: ${record.email}`)
    console.log(`   📅 Subscribed: ${record.subscribed_at || record.created_at}`)
    console.log(`   📍 Source: ${record.subscription_source}`)
    console.log(`   ✅ Status: ${record.status}`)
    console.log('   ─'.repeat(40))
  })
  
  // Check for recent additions (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recentData, error: recentError } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
  
  if (!recentError && recentData?.length > 0) {
    console.log(`\n🕒 Recent additions (last hour): ${recentData.length}`)
    recentData.forEach(record => {
      console.log(`   - ${record.email} at ${record.created_at}`)
    })
  } else {
    console.log('\n🕒 No recent additions in the last hour')
  }
  
  // Check for test emails we might have added
  const testEmails = [
    'newsletter-debug@test.com',
    'fixed@test.com', 
    'console@test.com',
    'newsletter@test.com'
  ]
  
  console.log('\n🔍 Checking for test emails...')
  for (const email of testEmails) {
    const { data: testData, error: testError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
    
    if (!testError && testData?.length > 0) {
      console.log(`   ✅ Found: ${email}`)
    }
  }
}

checkNewsletterCount() 