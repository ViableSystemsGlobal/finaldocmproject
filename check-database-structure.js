require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseStructure() {
  console.log('🔍 Checking current database structure...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check what tables exist
  const { data: tables, error: tablesError } = await supabase
    .rpc('sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });
    
  if (tablesError) {
    console.log('❌ Error getting tables. Let me try a different approach...');
    
    // Try checking for specific tables we need
    const tablesToCheck = ['follow_ups', 'events', 'event_attendance', 'donations', 'member_notes', 'groups', 'group_memberships'];
    
    for (const tableName of tablesToCheck) {
      console.log(`\nChecking ${tableName} table...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Table exists`);
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    }
  } else {
    console.log('Available tables:');
    tables?.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
  }
}

checkDatabaseStructure().catch(console.error); 