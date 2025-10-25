require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findNewsletterTables() {
  console.log('🔍 Searching for all newsletter-related tables...\n')
  
  // List of possible newsletter table names
  const possibleTables = [
    'newsletter_subscribers',
    'newsletter_subscriptions', 
    'newsletters',
    'email_subscribers',
    'subscribers',
    'subscriptions',
    'email_list',
    'mailing_list',
    'newsletter_list',
    'newsletter_members'
  ]
  
  console.log('Testing common newsletter table names...\n')
  
  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3)
      
      if (!error) {
        console.log(`✅ Found table: ${tableName}`)
        console.log(`📊 Record count: ${data?.length || 0}`)
        if (data?.[0]) {
          console.log(`📋 Columns: ${Object.keys(data[0]).join(', ')}`)
          console.log(`📝 Sample data:`, data[0])
        }
        console.log('─'.repeat(50))
      }
    } catch (err) {
      // Table doesn't exist, skip
    }
  }
  
  // Also try to get a list of all tables if possible
  console.log('\n🔍 Attempting to list all tables...')
  
  try {
    const { data: tableList, error: tableError } = await supabase.rpc('exec', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%newsletter%' 
        OR table_name LIKE '%subscr%'
        OR table_name LIKE '%email%'
        ORDER BY table_name;
      `
    }).catch(() => ({ data: null, error: { message: 'RPC not available' } }))
    
    if (tableList && tableList.length > 0) {
      console.log('\n📋 Tables containing newsletter/subscription/email keywords:')
      tableList.forEach(table => console.log(`  - ${table.table_name}`))
    } else {
      console.log('\n📋 Could not fetch table list (RPC not available)')
    }
  } catch (err) {
    console.log('\n📋 Could not fetch table list:', err.message)
  }
}

findNewsletterTables() 