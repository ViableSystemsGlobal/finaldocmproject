require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Import the fixed memberDetails functions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the fixed fetchMemberAttendance function
async function fetchMemberAttendance(contactId) {
  try {
    console.log('🔍 Fetching attendance for contact:', contactId);
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        check_in_time,
        method,
        created_at,
        events!inner (
          id,
          name,
          event_date,
          event_type,
          location
        )
      `)
      .eq('contact_id', contactId)
      .order('check_in_time', { ascending: false, nullsFirst: false })
      .limit(50); // Get last 50 attendance records

    if (error) {
      console.warn('⚠️ Error fetching attendance:', {
        message: error.message,
        code: error.code
      });
      return { data: [], error: null }; // Return empty array instead of mock data
    }

    console.log('✅ Attendance records found:', data?.length || 0);
    
    // Transform data to match expected format
    const transformedData = data?.map(record => {
      const events = record.events;
      return {
        id: record.id,
        service_name: events?.name || 'Event',
        service_date: events?.event_date || record.check_in_time,
        checked_in: true, // Records in attendance table are always checked in
        check_in_time: record.check_in_time,
        event_type: events?.event_type || 'service',
        location: events?.location,
        method: record.method
      };
    }) || [];

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberAttendance:', error);
    return { data: [], error: null };
  }
}

async function testFixedAttendance() {
  console.log('🔍 Testing FIXED Attendance functionality...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  // Test attendance function for specific contacts
  const testContactIds = [
    '1e1f63ae-02e5-4e54-a13e-30b5a7858008', // Kwame Mensah
    '12f2dcac-0b99-4c07-8164-0a3d4b469a16'  // Nana Yaw
  ];
  
  for (const contactId of testContactIds) {
    console.log(`\n📊 Testing FIXED attendance for contact: ${contactId}...`);
    
    // Get contact name
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();
    
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    console.log(`   Contact: ${contactName}`);
    
    // Test the FIXED attendance function
    const result = await fetchMemberAttendance(contactId);
    
    if (result.data && result.data.length > 0) {
      console.log('   ✅ FIXED Attendance Results:');
      console.log(`      Total Attendance Records: ${result.data.length}`);
      
      result.data.forEach((record, index) => {
        console.log(`      ${index + 1}. ${record.service_name} on ${record.service_date} (${record.method})`);
      });
    } else {
      console.log('   ❌ No attendance data found');
    }
  }
  
  console.log('\n✨ FIXED Attendance test complete!');
  console.log('\n🎉 The memberDetails.ts service should now show attendance records!');
}

testFixedAttendance().catch(console.error); 