const { createClient } = require('@supabase/supabase-js');

async function testMemberDetailsRealData() {
  console.log('🔍 Testing member details with real data...');
  
  const supabaseUrl = 'https://ufjfafcfkalaasdhgcbi.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDU4MjMsImV4cCI6MjA1NDAyMTgyM30.bZPZJ1r9OyBJG9X5WdJOJ8hV0MvFMZXDwv7EwQGwm3E';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('\n1. Testing new tables existence...');
  
  // Test follow_ups table
  try {
    const { data: followUps, error: followUpsError } = await supabase
      .from('follow_ups')
      .select('*')
      .limit(3);
    
    if (followUpsError) {
      console.log('❌ follow_ups table error:', followUpsError.code, followUpsError.message);
    } else {
      console.log('✅ follow_ups table exists with', followUps?.length || 0, 'records');
      if (followUps?.length > 0) {
        console.log('   Sample:', followUps[0]);
      }
    }
  } catch (err) {
    console.log('💥 follow_ups table error:', err.message);
  }
  
  // Test events table
  try {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(3);
    
    if (eventsError) {
      console.log('❌ events table error:', eventsError.code, eventsError.message);
    } else {
      console.log('✅ events table exists with', events?.length || 0, 'records');
      if (events?.length > 0) {
        console.log('   Sample:', events[0]);
      }
    }
  } catch (err) {
    console.log('💥 events table error:', err.message);
  }
  
  // Test event_attendance table
  try {
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events (title, start_date, event_type)
      `)
      .limit(3);
    
    if (attendanceError) {
      console.log('❌ event_attendance table error:', attendanceError.code, attendanceError.message);
    } else {
      console.log('✅ event_attendance table exists with', attendance?.length || 0, 'records');
      if (attendance?.length > 0) {
        console.log('   Sample:', attendance[0]);
      }
    }
  } catch (err) {
    console.log('💥 event_attendance table error:', err.message);
  }
  
  // Test donations table
  try {
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('*')
      .limit(3);
    
    if (donationsError) {
      console.log('❌ donations table error:', donationsError.code, donationsError.message);
    } else {
      console.log('✅ donations table exists with', donations?.length || 0, 'records');
      if (donations?.length > 0) {
        console.log('   Sample:', donations[0]);
      }
    }
  } catch (err) {
    console.log('💥 donations table error:', err.message);
  }
  
  // Test member_notes table
  try {
    const { data: notes, error: notesError } = await supabase
      .from('member_notes')
      .select('*')
      .limit(3);
    
    if (notesError) {
      console.log('❌ member_notes table error:', notesError.code, notesError.message);
    } else {
      console.log('✅ member_notes table exists with', notes?.length || 0, 'records');
      if (notes?.length > 0) {
        console.log('   Sample:', notes[0]);
      }
    }
  } catch (err) {
    console.log('💥 member_notes table error:', err.message);
  }
  
  console.log('\n2. Testing with a real contact...');
  
  // Get a sample contact ID to test with
  try {
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .limit(1);
    
    if (contactsError) {
      console.log('❌ contacts table error:', contactsError.code, contactsError.message);
      return;
    }
    
    if (!contacts || contacts.length === 0) {
      console.log('⚠️ No contacts found to test with');
      return;
    }
    
    const testContact = contacts[0];
    console.log('📝 Testing with contact:', testContact.first_name, testContact.last_name, '(' + testContact.id + ')');
    
    // Test follow-ups for this contact
    console.log('\n3. Testing follow-ups query...');
    const { data: contactFollowUps, error: contactFollowUpsError } = await supabase
      .from('follow_ups')
      .select('id, type, notes, scheduled_date, completed, priority')
      .eq('contact_id', testContact.id)
      .order('scheduled_date', { ascending: false });
    
    if (contactFollowUpsError) {
      console.log('❌ Contact follow-ups error:', contactFollowUpsError.message);
    } else {
      console.log('✅ Found', contactFollowUps?.length || 0, 'follow-ups for this contact');
      if (contactFollowUps?.length > 0) {
        console.log('   Sample:', contactFollowUps[0]);
      }
    }
    
    // Test attendance for this contact
    console.log('\n4. Testing attendance query...');
    const { data: contactAttendance, error: contactAttendanceError } = await supabase
      .from('event_attendance')
      .select(`
        id,
        checked_in,
        check_in_time,
        events (
          title,
          start_date,
          event_type,
          location
        )
      `)
      .eq('contact_id', testContact.id)
      .order('check_in_time', { ascending: false, nullsFirst: false })
      .limit(10);
    
    if (contactAttendanceError) {
      console.log('❌ Contact attendance error:', contactAttendanceError.message);
    } else {
      console.log('✅ Found', contactAttendance?.length || 0, 'attendance records for this contact');
      if (contactAttendance?.length > 0) {
        console.log('   Sample:', contactAttendance[0]);
      }
    }
    
    // Test donations for this contact
    console.log('\n5. Testing donations query...');
    const { data: contactDonations, error: contactDonationsError } = await supabase
      .from('donations')
      .select('amount, donation_date, payment_method, fund_designation')
      .eq('contact_id', testContact.id)
      .order('donation_date', { ascending: false });
    
    if (contactDonationsError) {
      console.log('❌ Contact donations error:', contactDonationsError.message);
    } else {
      console.log('✅ Found', contactDonations?.length || 0, 'donations for this contact');
      if (contactDonations?.length > 0) {
        console.log('   Sample:', contactDonations[0]);
        
        // Calculate giving summary
        const currentYear = new Date().getFullYear();
        const yearToDateDonations = contactDonations.filter(d => 
          new Date(d.donation_date).getFullYear() === currentYear
        );
        const yearToDateTotal = yearToDateDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
        
        console.log('   Giving summary:');
        console.log('     - Total donations:', contactDonations.length);
        console.log('     - YTD total: $' + yearToDateTotal.toFixed(2));
        console.log('     - Last donation:', contactDonations[0].donation_date);
      }
    }
    
    // Test notes for this contact
    console.log('\n6. Testing member notes query...');
    const { data: contactNotes, error: contactNotesError } = await supabase
      .from('member_notes')
      .select('id, note_type, title, content, tags, created_at')
      .eq('contact_id', testContact.id)
      .order('created_at', { ascending: false });
    
    if (contactNotesError) {
      console.log('❌ Contact notes error:', contactNotesError.message);
    } else {
      console.log('✅ Found', contactNotes?.length || 0, 'notes for this contact');
      if (contactNotes?.length > 0) {
        console.log('   Sample:', contactNotes[0]);
      }
    }
    
  } catch (err) {
    console.log('💥 Error testing with contact:', err.message);
  }
  
  console.log('\n✨ Member details real data testing complete!');
}

testMemberDetailsRealData().catch(console.error); 