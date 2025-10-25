require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

async function checkPrayerTable() {
  console.log('🔍 Checking prayer_requests table structure...');
  
  // Try to get the table structure
  const { data, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ Error accessing prayer_requests:', error);
  } else {
    console.log('✅ Prayer requests table accessible');
    if (data && data[0]) {
      console.log('📋 Available columns:', Object.keys(data[0]).join(', '));
      console.log('📝 Sample record:', data[0]);
    } else {
      console.log('📋 Table is empty, checking recent records...');
      const { data: recentData, error: recentError } = await supabase
        .from('prayer_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentData && recentData.length > 0) {
        console.log('📋 Available columns:', Object.keys(recentData[0]).join(', '));
        console.log('📝 Recent records:', recentData.length);
      } else {
        console.log('📋 No records found in prayer_requests table');
      }
    }
  }
}

checkPrayerTable(); 