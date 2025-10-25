require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkAttendanceData() {
  console.log('🔍 Checking attendance data in the attendance table...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Step 1: Check attendance table data
  console.log('\n1. Checking attendance table...');
  const { data: allAttendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .limit(10);
    
  if (attendanceError) {
    console.log('❌ Error getting attendance:', attendanceError.message);
    return;
  }
  
  console.log(`Found ${allAttendance?.length || 0} attendance records total:`);
  allAttendance?.forEach((record, index) => {
    console.log(`  ${index + 1}. Contact: ${record.contact_id}, Event: ${record.event_id}, Time: ${record.check_in_time}, Method: ${record.method}`);
  });
  
  // Step 2: Test attendance for specific contacts (similar to memberDetails query)
  const testContactIds = [
    '1e1f63ae-02e5-4e54-a13e-30b5a7858008', // Kwame Mensah
    '12f2dcac-0b99-4c07-8164-0a3d4b469a16'  // Nana Yaw
  ];
  
  for (const contactId of testContactIds) {
    console.log(`\n2. Testing attendance for contact: ${contactId}...`);
    
    // Get contact name
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();
    
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    console.log(`   Contact: ${contactName}`);
    
    // Query attendance table with join to events (like memberDetails should)
    const { data: contactAttendance, error: contactAttendanceError } = await supabase
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
      .limit(50);

    if (contactAttendanceError) {
      console.log('❌ Error fetching attendance for contact:', contactAttendanceError.message);
      continue;
    }

    console.log(`   Found ${contactAttendance?.length || 0} attendance records for this contact`);
    
    if (!contactAttendance || contactAttendance.length === 0) {
      console.log('   ❌ No attendance found - Attendance tab will be empty');
      continue;
    }

    console.log('   📊 Attendance records:');
    contactAttendance.forEach((record, index) => {
      const events = record.events;
      console.log(`      ${index + 1}. ${events?.name || 'Event'} on ${record.check_in_time} via ${record.method}`);
    });
  }
  
  console.log('\n✨ Attendance data analysis complete!');
  console.log('\n🔧 THE ISSUE: The memberDetails.ts service is looking for "event_attendance" table, but attendance data is stored in the "attendance" table!');
}

checkAttendanceData().catch(console.error); 