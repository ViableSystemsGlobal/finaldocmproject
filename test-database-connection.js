require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Environment check:')
console.log('- Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('- Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please check your .env file in apps/web/')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseConnection() {
  console.log('\n🔍 Testing database connection and table structure...')
  
  try {
    // Test 1: Check if website_messages table exists and its structure
    console.log('\n1. Testing website_messages table...')
    const { data: tableData, error: tableError } = await supabase
      .from('website_messages')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error accessing website_messages table:', tableError)
    } else {
      console.log('✅ website_messages table accessible')
      console.log('📊 Sample data structure:', tableData?.[0] ? Object.keys(tableData[0]) : 'No data')
    }

    // Test 2: Try to insert a test record
    console.log('\n2. Testing insert into website_messages...')
    const testSubmission = {
      id: crypto.randomUUID(),
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Database Test',
      message: 'Testing database connection',
      category: 'General Inquiry',
      source: 'website',
      status: 'unread',
      newsletter_opt_in: false,
      is_prayer_request: false,
      submitted_at: new Date().toISOString()
    }

    console.log('📝 Test payload:', testSubmission)

    const { data: insertData, error: insertError } = await supabase
      .from('website_messages')
      .insert([testSubmission])
      .select()

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError)
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2))
    } else {
      console.log('✅ Test record inserted successfully!')
      console.log('✅ Inserted data:', insertData)
      
      // Clean up test record
      await supabase
        .from('website_messages')
        .delete()
        .eq('id', testSubmission.id)
      console.log('🧹 Test record cleaned up')
    }

    // Test 3: Check all existing records
    console.log('\n3. Checking all existing records...')
    const { data: allData, error: allError } = await supabase
      .from('website_messages')
      .select('id, name, email, subject, created_at, submitted_at, status')
      .order('created_at', { ascending: false })
      .limit(10)

    if (allError) {
      console.error('❌ Error fetching existing records:', allError)
    } else {
      console.log('✅ Found', allData?.length || 0, 'existing records')
      allData?.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.name} - ${record.subject} (${record.status})`)
      })
    }

    // Test 4: Check table schema
    console.log('\n4. Checking table schema...')
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'website_messages'
        ORDER BY ordinal_position;
      `
    })

    if (schemaError) {
      console.error('❌ Error fetching schema:', schemaError)
    } else {
      console.log('✅ Table schema:')
      schemaData?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDatabaseConnection() 