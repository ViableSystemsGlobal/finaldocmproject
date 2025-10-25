const { createClient } = require('@supabase/supabase-js');

async function testSimpleMemberDetails() {
  console.log('🔍 Testing member details tables (simple check)...');
  
  const supabaseUrl = 'https://ufjfafcfkalaasdhgcbi.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDU4MjMsImV4cCI6MjA1NDAyMTgyM30.bZPZJ1r9OyBJG9X5WdJOJ8hV0MvFMZXDwv7EwQGwm3E';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('✅ Supabase client created');
  
  // Test contacts table first (we know this works)
  console.log('\n1. Testing contacts table...');
  try {
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);
    
    if (contactsError) {
      console.log('❌ contacts table error:', contactsError.message);
      console.log('🚨 Basic database access is failing - check your credentials');
      return;
    } else {
      console.log('✅ contacts table accessible');
    }
  } catch (err) {
    console.log('💥 contacts table error:', err.message);
    return;
  }
  
  // List of tables to test
  const tablesToTest = [
    'follow_ups',
    'events', 
    'event_attendance',
    'donations',
    'member_notes'
  ];
  
  console.log('\n2. Testing new member details tables...');
  
  for (const tableName of tablesToTest) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName} table error:`, error.message);
        if (error.code === '42P01') {
          console.log(`   → Table ${tableName} does not exist - run create-member-details-tables.sql first`);
        } else if (error.code === '42501') {
          console.log(`   → Permission denied - run fix-member-details-rls.sql to fix RLS policies`);
        }
      } else {
        console.log(`✅ ${tableName} table exists with ${count || 0} records`);
      }
    } catch (err) {
      console.log(`💥 ${tableName} table error:`, err.message);
    }
  }
  
  console.log('\n✨ Simple member details test complete!');
  console.log('\n📝 Next steps:');
  console.log('1. If tables don\'t exist: Run create-member-details-tables.sql in Supabase Dashboard');
  console.log('2. If permission denied: Run fix-member-details-rls.sql in Supabase Dashboard');
  console.log('3. Then test the member details pages in your application');
}

testSimpleMemberDetails().catch(console.error); 