require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugMemberDetails() {
  console.log('🔍 Debugging member details for specific contacts...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Step 1: Get all contacts to see which ones we have
  console.log('\n1. Getting all contacts...');
  const { data: allContacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .limit(5);
    
  if (contactsError) {
    console.log('❌ Error getting contacts:', contactsError.message);
    return;
  }
  
  console.log('Available contacts:');
  allContacts?.forEach((contact, index) => {
    console.log(`  ${index + 1}. ${contact.first_name} ${contact.last_name} (${contact.id})`);
  });
  
  // Step 2: Check what follow-ups exist and for which contacts
  console.log('\n2. Checking all follow-ups data...');
  const { data: allFollowUps, error: followUpsError } = await supabase
    .from('follow_ups')
    .select('id, contact_id, type, notes, scheduled_date, completed');
    
  if (followUpsError) {
    console.log('❌ Error getting follow-ups:', followUpsError.message);
  } else {
    console.log(`Found ${allFollowUps?.length || 0} follow-ups total:`);
    allFollowUps?.forEach((followUp, index) => {
      console.log(`  ${index + 1}. Contact: ${followUp.contact_id}, Type: ${followUp.type}, Notes: ${followUp.notes}`);
    });
  }
  
  // Step 3: Check events and attendance
  console.log('\n3. Checking events and attendance...');
  const { data: allEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, title, start_date, event_type');
    
  if (eventsError) {
    console.log('❌ Error getting events:', eventsError.message);
  } else {
    console.log(`Found ${allEvents?.length || 0} events:`);
    allEvents?.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (${event.start_date}) - ${event.event_type}`);
    });
  }
  
  const { data: allAttendance, error: attendanceError } = await supabase
    .from('event_attendance')
    .select('id, contact_id, event_id, checked_in, check_in_time');
    
  if (attendanceError) {
    console.log('❌ Error getting attendance:', attendanceError.message);
  } else {
    console.log(`Found ${allAttendance?.length || 0} attendance records:`);
    allAttendance?.forEach((attendance, index) => {
      console.log(`  ${index + 1}. Contact: ${attendance.contact_id}, Event: ${attendance.event_id}, Checked in: ${attendance.checked_in}`);
    });
  }
  
  // Step 4: Test the actual memberDetails queries for the first contact
  if (allContacts && allContacts.length > 0) {
    const testContact = allContacts[0];
    console.log(`\n4. Testing member details queries for ${testContact.first_name} ${testContact.last_name}...`);
    
    // Test follow-ups query (exactly like in memberDetails.ts)
    console.log('\n📋 Testing follow-ups query...');
    const { data: contactFollowUps, error: contactFollowUpsError } = await supabase
      .from('follow_ups')
      .select('id, type, notes, scheduled_date, completed_at, completed, priority, created_at')
      .eq('contact_id', testContact.id)
      .order('scheduled_date', { ascending: false });
    
    if (contactFollowUpsError) {
      console.log('❌ Follow-ups query error:', contactFollowUpsError.message);
    } else {
      console.log(`✅ Found ${contactFollowUps?.length || 0} follow-ups for this contact`);
      contactFollowUps?.forEach((followUp, index) => {
        console.log(`  ${index + 1}. ${followUp.type}: ${followUp.notes} (${followUp.completed ? 'Completed' : 'Pending'})`);
      });
    }
    
    // Test attendance query (exactly like in memberDetails.ts)  
    console.log('\n📊 Testing attendance query...');
    const { data: contactAttendance, error: contactAttendanceError } = await supabase
      .from('event_attendance')
      .select(`
        id,
        checked_in,
        check_in_time,
        registered_at,
        events!inner (
          id,
          title,
          start_date,
          event_type,
          location
        )
      `)
      .eq('contact_id', testContact.id)
      .order('check_in_time', { ascending: false, nullsFirst: false })
      .limit(50);
    
    if (contactAttendanceError) {
      console.log('❌ Attendance query error:', contactAttendanceError.message);
    } else {
      console.log(`✅ Found ${contactAttendance?.length || 0} attendance records for this contact`);
      contactAttendance?.forEach((attendance, index) => {
        console.log(`  ${index + 1}. ${attendance.events?.title} on ${attendance.events?.start_date} - Checked in: ${attendance.checked_in}`);
      });
    }
    
    // Test group memberships
    console.log('\n👥 Testing group memberships...');
    const { data: contactGroupMemberships, error: contactGroupError } = await supabase
      .from('group_memberships')
      .select(`
        role,
        joined_at,
        status,
        groups (
          id,
          name,
          description,
          type
        )
      `)
      .eq('contact_id', testContact.id);
    
    if (contactGroupError) {
      console.log('❌ Group memberships query error:', contactGroupError.message);
    } else {
      console.log(`✅ Found ${contactGroupMemberships?.length || 0} group memberships for this contact`);
      contactGroupMemberships?.forEach((membership, index) => {
        console.log(`  ${index + 1}. ${membership.groups?.name} (${membership.groups?.type}) - Role: ${membership.role}`);
      });
    }
  }
  
  console.log('\n✨ Debug complete!');
}

debugMemberDetails().catch(console.error); 