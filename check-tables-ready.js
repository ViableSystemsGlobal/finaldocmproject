require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkTablesReady() {
  console.log('🔍 Checking if all required tables exist for sample data...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const requiredTables = [
    'donations',
    'event_attendance', 
    'member_notes',
    'follow_ups',
    'events'
  ];
  
  const requiredColumns = {
    'donations': ['contact_id', 'amount', 'donation_date', 'payment_method', 'fund_designation'],
    'events': ['title', 'start_date'],
    'follow_ups': ['scheduled_date', 'completed', 'completed_at'],
    'event_attendance': ['event_id', 'contact_id', 'checked_in', 'check_in_time'],
    'member_notes': ['contact_id', 'note_type', 'title', 'content', 'is_private']
  };
  
  let allReady = true;
  
  console.log('\n📋 Checking tables...');
  
  for (const tableName of requiredTables) {
    try {
      // Check if table exists
      const { data: tableExists, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (tableError || !tableExists || tableExists.length === 0) {
        console.log(`❌ Table '${tableName}' does not exist`);
        allReady = false;
        continue;
      }
      
      console.log(`✅ Table '${tableName}' exists`);
      
      // Check required columns
      if (requiredColumns[tableName]) {
        for (const columnName of requiredColumns[tableName]) {
          const { data: columnExists, error: columnError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_schema', 'public')
            .eq('table_name', tableName)
            .eq('column_name', columnName);
          
          if (columnError || !columnExists || columnExists.length === 0) {
            console.log(`   ❌ Column '${columnName}' missing in '${tableName}'`);
            allReady = false;
          } else {
            console.log(`   ✅ Column '${columnName}' exists in '${tableName}'`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Error checking table '${tableName}':`, error.message);
      allReady = false;
    }
  }
  
  console.log('\n📊 Summary:');
  if (allReady) {
    console.log('✅ All required tables and columns exist!');
    console.log('✅ You can safely run add-sample-member-data-fixed.sql in Supabase Dashboard');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy the contents of add-sample-member-data-fixed.sql');
    console.log('3. Paste and run the script');
    console.log('4. Refresh your member details page to see giving data');
  } else {
    console.log('❌ Some required tables or columns are missing');
    console.log('❌ Run fix-member-details-tables.sql first in Supabase Dashboard');
  }
}

checkTablesReady().catch(console.error); 