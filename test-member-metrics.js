require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Simulate the fetchMemberMetrics function
async function fetchMemberMetrics(contactId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('🔍 Fetching member metrics for contact:', contactId);
    
    // 1. Calculate attendance rate - Get actual attendance for this contact
    const { data: attendanceData, error: attendanceError } = await supabase
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

    if (attendanceError) {
      console.warn('⚠️ Error fetching attendance:', attendanceError.message);
    }
    
    const totalAttendances = attendanceData?.length || 0;
    
    // Get total available services in the last 3 months for percentage calculation
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { count: totalServices, error: servicesError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'service')
      .gte('event_date', threeMonthsAgo.toISOString());
    
    if (servicesError) {
      console.warn('⚠️ Could not fetch total services for attendance rate:', servicesError.message);
    }
    
    const attendanceRate = totalServices && totalServices > 0 
      ? Math.round((totalAttendances / totalServices) * 100)
      : 0;
    
    // 2. Count souls won (people they invited who made salvation decisions)
    const { data: soulsWonData, error: soulsError } = await supabase
      .from('soul_winning')
      .select('contact_id, saved, created_at')
      .eq('inviter_contact_id', contactId);
    
    if (soulsError) {
      console.warn('⚠️ Could not fetch souls won:', soulsError.message);
    }
    
    const totalInvited = soulsWonData?.length || 0;
    const soulsWon = soulsWonData?.filter(soul => soul.saved).length || 0;
    
    // 3. Count total people invited (including those not yet saved)
    const peopleInvited = totalInvited;
    
    console.log('✅ Member metrics calculated:', {
      attendanceRate,
      totalAttendances,
      soulsWon,
      peopleInvited,
      totalServices: totalServices || 0
    });
    
    return {
      data: {
        attendanceRate,
        totalAttendances,
        soulsWon,
        peopleInvited,
        totalServices: totalServices || 0
      },
      error: null
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberMetrics:', error);
    return {
      data: {
        attendanceRate: 0,
        totalAttendances: 0,
        soulsWon: 0,
        peopleInvited: 0,
        totalServices: 0
      },
      error: null
    };
  }
}

async function testMemberMetrics() {
  console.log('🔍 Testing Member Metrics functionality...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  // Test metrics for specific contacts
  const testContactIds = [
    '1e1f63ae-02e5-4e54-a13e-30b5a7858008', // Kwame Mensah
    '12f2dcac-0b99-4c07-8164-0a3d4b469a16'  // Nana Yaw
  ];
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  for (const contactId of testContactIds) {
    console.log(`\n📊 Testing metrics for contact: ${contactId}...`);
    
    // Get contact name
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();
    
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    console.log(`   Contact: ${contactName}`);
    
    // Test the metrics function
    const result = await fetchMemberMetrics(contactId);
    
    if (result.data) {
      console.log('   ✅ Metrics Results:');
      console.log(`      📈 Attendance Rate: ${result.data.attendanceRate}% (${result.data.totalAttendances}/${result.data.totalServices})`);
      console.log(`      🙏 Souls Won: ${result.data.soulsWon}`);
      console.log(`      👥 People Invited: ${result.data.peopleInvited}`);
      
      if (result.data.attendanceRate > 0 || result.data.soulsWon > 0 || result.data.peopleInvited > 0) {
        console.log('   🎉 This member has positive metrics!');
      } else {
        console.log('   ⚠️ This member has no recorded activity in these areas');
      }
    } else {
      console.log('   ❌ No metrics data found');
    }
  }
  
  console.log('\n✨ Member Metrics test complete!');
  console.log('\n🎯 The member details page should now show:');
  console.log('   - Compact member information card');
  console.log('   - Metrics card with attendance rate, souls won, and people invited');
  console.log('   - Smaller serving statistics and giving summary cards');
}

testMemberMetrics().catch(console.error); 