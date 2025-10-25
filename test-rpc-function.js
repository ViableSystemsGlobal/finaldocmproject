const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPCFunction() {
  console.log('🔍 Checking if get_member_all_group_memberships RPC function exists...');
  
  try {
    // Test calling the function with a dummy UUID
    const { data, error } = await supabase.rpc('get_member_all_group_memberships', { 
      p_contact_id: '00000000-0000-0000-0000-000000000000' 
    });
    
    if (error) {
      console.log('❌ RPC function error:', error.code, error.message);
      if (error.code === '42883') {
        console.log('🚨 Function does not exist in database');
      }
    } else {
      console.log('✅ RPC function exists and returned:', data?.length || 0, 'results');
    }
  } catch (err) {
    console.log('💥 Unexpected error:', err.message);
  }
  
  // Also check what functions DO exist
  console.log('\n🔍 Checking what RPC functions are available...');
  try {
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%member%')
      .limit(10);
    
    if (funcError) {
      console.log('❌ Cannot query pg_proc:', funcError.message);
    } else {
      console.log('📋 Found member-related functions:', functions?.map(f => f.proname) || []);
    }
  } catch (err) {
    console.log('⚠️ Cannot check pg_proc:', err.message);
  }
}

checkRPCFunction(); 