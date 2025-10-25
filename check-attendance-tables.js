require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkAttendanceTables() {
  console.log('🔍 Checking attendance-related tables...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check what attendance-related tables exist
  const attendanceTableNames = [
    'event_attendance',
    'attendance',
    'attendances', 
    'check_ins',
    'checkins',
    'event_checkins'
  ];
  
  console.log('\n📋 Checking for attendance tables...');
  for (const tableName of attendanceTableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${tableName}' does not exist or is inaccessible`);
      } else {
        console.log(`✅ Table '${tableName}' exists! Found ${data?.length || 0} sample records`);
        
        // If we found data, show the structure
        if (data && data.length > 0) {
          console.log(`   Sample record structure:`, Object.keys(data[0]));
        }
        
        // Get total count
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        console.log(`   Total records: ${count || 0}`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}':`, err.message);
    }
  }
  
  // Check all tables to see if there's something attendance-related we missed
  console.log('\n🔍 Looking for all tables in the database...');
  try {
    const { data: allTables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('❌ Could not list tables:', error.message);
    } else {
      console.log('📋 All tables in database:');
      allTables?.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`);
      });
      
      // Look for anything that might be attendance-related
      const possibleAttendanceTables = allTables?.filter(table => 
        table.table_name.toLowerCase().includes('attend') ||
        table.table_name.toLowerCase().includes('check') ||
        table.table_name.toLowerCase().includes('event')
      ) || [];
      
      if (possibleAttendanceTables.length > 0) {
        console.log('\n🎯 Tables that might be related to attendance:');
        possibleAttendanceTables.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Error listing tables:', err.message);
  }
  
  console.log('\n✨ Attendance table check complete!');
}

checkAttendanceTables().catch(console.error); 