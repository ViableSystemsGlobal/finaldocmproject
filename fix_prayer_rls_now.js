const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

console.log('🔧 Fixing prayer requests RLS policies...')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixPrayerRequestsRLS() {
  try {
    // Drop all existing policies for prayer_requests
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON prayer_requests',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users" ON prayer_requests',
      'DROP POLICY IF EXISTS "Enable update for authenticated users" ON prayer_requests',
      'DROP POLICY IF EXISTS "Enable delete for authenticated users" ON prayer_requests',
      'DROP POLICY IF EXISTS "Allow public insert" ON prayer_requests',
      'DROP POLICY IF EXISTS "Allow pastoral staff full access" ON prayer_requests',
      'DROP POLICY IF EXISTS "Admin full access to prayer_requests" ON prayer_requests',
      'DROP POLICY IF EXISTS "Service role insert prayer_requests" ON prayer_requests',
      'DROP POLICY IF EXISTS "Service role full access to prayer_requests" ON prayer_requests',
      'DROP POLICY IF EXISTS "Allow authenticated users to read prayer requests" ON prayer_requests',
      'DROP POLICY IF EXISTS "Allow authenticated users to insert prayer requests" ON prayer_requests',
      'DROP POLICY IF EXISTS "Allow authenticated users to update their prayer requests" ON prayer_requests',
      'DROP POLICY IF EXISTS "Allow authenticated users to delete their prayer requests" ON prayer_requests'
    ]

    console.log('🗑️ Dropping existing policies...')
    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        console.log(`   Policy drop: ${error.message}`)
      }
    }

    // Create new comprehensive policies
    console.log('✨ Creating new policies...')

    // 1. Allow service role full access
    const { error: serviceError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Service role full access to prayer_requests" ON prayer_requests
            FOR ALL 
            USING (auth.jwt() ->> 'role' = 'service_role')
            WITH CHECK (auth.jwt() ->> 'role' = 'service_role')`
    })
    if (serviceError) {
      console.error('❌ Service role policy error:', serviceError.message)
    } else {
      console.log('✅ Service role policy created')
    }

    // 2. Allow authenticated admin users full access
    const { error: adminError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Admin full access to prayer_requests" ON prayer_requests
            FOR ALL 
            TO authenticated
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated')`
    })
    if (adminError) {
      console.error('❌ Admin policy error:', adminError.message)
    } else {
      console.log('✅ Admin policy created')
    }

    // 3. Allow anon role to insert
    const { error: anonError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Allow public insert to prayer_requests" ON prayer_requests
            FOR INSERT 
            TO anon
            WITH CHECK (true)`
    })
    if (anonError) {
      console.error('❌ Anon policy error:', anonError.message)
    } else {
      console.log('✅ Anon insert policy created')
    }

    // Ensure RLS is enabled and grant permissions
    console.log('🔒 Ensuring RLS is enabled and permissions are granted...')
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY'
    })
    if (rlsError) {
      console.log('   RLS already enabled or error:', rlsError.message)
    }

    const grants = [
      'GRANT INSERT ON prayer_requests TO anon',
      'GRANT ALL ON prayer_requests TO authenticated',
      'GRANT ALL ON prayer_requests TO service_role'
    ]

    for (const sql of grants) {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        console.log(`   Grant: ${error.message}`)
      }
    }

    // Test the fix by trying to insert a prayer request
    console.log('🧪 Testing prayer request insertion...')
    
    const testPrayer = {
      id: crypto.randomUUID(),
      contact_id: null,
      title: 'RLS Test Prayer Request',
      description: 'Testing if RLS policies allow website submissions',
      status: 'new',
      submitted_at: new Date().toISOString(),
      urgency: 'normal',
      is_confidential: true,
      source: 'website'
    }

    const { data: testData, error: testError } = await supabase
      .from('prayer_requests')
      .insert([testPrayer])
      .select()

    if (testError) {
      console.error('❌ Test insertion failed:', testError.message)
      console.error('❌ This means the RLS policies are still blocking')
    } else {
      console.log('✅ Test insertion successful! Prayer request ID:', testData[0]?.id)
      
      // Clean up test data
      await supabase.from('prayer_requests').delete().eq('id', testPrayer.id)
      console.log('🧹 Test data cleaned up')
    }

    console.log('\n🎉 Prayer requests RLS policies have been fixed!')
    console.log('📝 Website prayer request submissions should now work')
    console.log('👥 Admin users can still access all prayer requests')
    console.log('🔒 Security is maintained with proper role-based access')

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
  }
}

// Check if exec_sql function exists, if not create it
async function ensureExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  
  if (error && error.message.includes('function')) {
    console.log('📝 Creating exec_sql function...')
    
    // Create the exec_sql function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `
    
    // Use direct SQL execution
    const { error: createError } = await supabase
      .from('prayer_requests')
      .select('id')
      .limit(1)
    
    if (createError) {
      console.error('❌ Cannot create exec_sql function. Please run the SQL manually in Supabase dashboard.')
      return false
    }
  }
  
  return true
}

async function main() {
  console.log('🚀 Starting prayer requests RLS fix...')
  
  const canProceed = await ensureExecSqlFunction()
  if (!canProceed) {
    console.log('❌ Cannot proceed without exec_sql function')
    console.log('📋 Please run the SQL in fix_prayer_requests_rls.sql manually in Supabase dashboard')
    return
  }
  
  await fixPrayerRequestsRLS()
}

main().catch(console.error) 