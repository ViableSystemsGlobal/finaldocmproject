require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPrayerSchema() {
  console.log('🔍 Checking prayer_requests table schema...\n')
  
  // Get the actual columns by trying to insert with all possible fields
  const testId = 'test-' + Date.now()
  
  // Test what columns exist by trying to insert
  const testPayload = {
    id: testId,
    name: 'Test Name',
    email: 'test@example.com', 
    phone: '123-456-7890',
    subject: 'Test Subject',
    title: 'Test Title',
    message: 'Test Message',
    description: 'Test Description',
    category: 'Test Category',
    status: 'new',
    submitted_at: new Date().toISOString()
  }
  
  console.log('Testing insert with common fields...')
  const { data, error } = await supabase
    .from('prayer_requests')
    .insert([testPayload])
    .select()
  
  if (error) {
    console.error('❌ Insert failed:', error)
    
    // Look for column not found errors to understand schema
    if (error.message?.includes('Could not find')) {
      console.log('📊 Schema mismatch detected in error message')
    }
  } else {
    console.log('✅ Insert succeeded with payload:', data)
    
    // Clean up
    await supabase.from('prayer_requests').delete().eq('id', testId)
    console.log('🧹 Test record cleaned up')
  }
  
  // Also check a successful record to see its structure
  console.log('\nChecking existing prayer request structure...')
  const { data: existingData, error: existingError } = await supabase
    .from('prayer_requests')
    .select('*')
    .limit(1)
  
  if (existingData && existingData[0]) {
    console.log('📊 Existing record structure:')
    console.log('Columns:', Object.keys(existingData[0]))
    console.log('Sample values:', existingData[0])
  }
}

checkPrayerSchema() 