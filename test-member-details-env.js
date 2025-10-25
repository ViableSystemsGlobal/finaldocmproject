require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testMemberDetailsWithEnv() {
  console.log('🔍 Testing member details with environment variables...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Environment check:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n🚨 Missing environment variables!');
    console.log('Please ensure your .env.local file contains:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('\n✅ Supabase client created');
  
  // Test contacts table first
  console.log('\n1. Testing contacts table...');
  try {
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .limit(1);
    
    if (contactsError) {
      console.log('❌ contacts table error:', contactsError.message);
      console.log('🚨 Basic database access is failing');
      return;
    } else {
      console.log('✅ contacts table accessible');
      if (contacts?.length > 0) {
        console.log('   Sample contact:', contacts[0].first_name, contacts[0].last_name);
      }
    }
  } catch (err) {
    console.log('💥 contacts table error:', err.message);
    return;
  }
  
  // Test new tables
  const tablesToTest = [
    'follow_ups',
    'events', 
    'event_attendance',
    'donations',
    'member_notes'
  ];
  
  console.log('\n2. Testing member details tables...');
  
  let allTablesExist = true;
  
  for (const tableName of tablesToTest) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}:`, error.message);
        if (error.code === '42P01') {
          console.log(`   → Table does not exist`);
          allTablesExist = false;
        } else if (error.code === '42501') {
          console.log(`   → Permission denied`);
        }
      } else {
        console.log(`✅ ${tableName}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`💥 ${tableName}:`, err.message);
      allTablesExist = false;
    }
  }
  
  console.log('\n✨ Test complete!');
  
  if (!allTablesExist) {
    console.log('\n📝 Next steps:');
    console.log('1. Run create-member-details-tables.sql in your Supabase Dashboard');
    console.log('2. If you get permission errors, run fix-member-details-rls.sql');
    console.log('3. Then the member details tabs will show real data');
  } else {
    console.log('\n🎉 All tables exist! Member details should now show real data.');
  }
}

testMemberDetailsWithEnv().catch(console.error); 