require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the updated fetchMemberJourney function
async function fetchMemberJourney(contactId, page = 1, limit = 4) {
  try {
    console.log('🔍 Fetching member journey for contact:', contactId, `(page ${page}, limit ${limit})`);
    
    // Build complete timeline of all events first
    const allEvents = [];

    // 1. Get member join date from contacts table
    try {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('created_at, first_name, last_name')
        .eq('id', contactId)
        .single();
      
      if (contactData) {
        allEvents.push({
          id: 'contact-created',
          type: 'joined',
          title: 'Joined Church Database',
          description: `${contactData.first_name} ${contactData.last_name} was added to the church database`,
          date: contactData.created_at,
          icon: 'user-plus'
        });
      }
    } catch (err) {
      console.log('⚠️ Could not fetch contact data:', err);
    }

    // 2. Get all transactions (giving events)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, amount, transacted_at, payment_method, category')
      .eq('contact_id', contactId)
      .order('transacted_at', { ascending: false });

    // Add first donation if exists
    if (transactions && transactions.length > 0) {
      const firstTransaction = transactions[transactions.length - 1];
      allEvents.push({
        id: 'first-donation',
        type: 'giving',
        title: 'First Contribution',
        description: `Made first donation of $${firstTransaction.amount.toFixed(2)}`,
        date: firstTransaction.transacted_at,
        icon: 'heart'
      });

      // Add generous giver milestone if applicable
      const totalGiving = transactions.reduce((sum, t) => sum + t.amount, 0);
      if (totalGiving > 1000) {
        allEvents.push({
          id: 'giving-milestone',
          type: 'milestone',
          title: 'Generous Giver',
          description: `Contributed $${totalGiving.toFixed(2)} across ${transactions.length} donations`,
          date: transactions[0].transacted_at,
          icon: 'heart',
          category: 'giving'
        });
      }
    }

    // 3. Get attendance events
    const { data: attendance } = await supabase
      .from('attendance')
      .select(`
        id,
        check_in_time,
        events!inner (
          id,
          name,
          event_date
        )
      `)
      .eq('contact_id', contactId)
      .order('check_in_time', { ascending: false })
      .limit(5);

    // Add first attendance
    if (attendance && attendance.length > 0) {
      const firstAttendance = attendance[attendance.length - 1];
      const events = firstAttendance.events;
      allEvents.push({
        id: 'first-attendance',
        type: 'attendance',
        title: 'First Service Attendance',
        description: `Attended ${events?.name || 'Service'}`,
        date: events?.event_date || firstAttendance.check_in_time,
        icon: 'calendar-check'
      });

      // Add regular attendee milestone
      if (attendance.length >= 3) {
        allEvents.push({
          id: 'attendance-milestone',
          type: 'milestone',
          title: 'Regular Attendee',
          description: `Attended ${attendance.length}+ services - showing consistent commitment`,
          date: attendance[0].check_in_time,
          icon: 'award',
          category: 'attendance'
        });
      }
    }

    // Sort ALL events by date (most recent first)
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply clean pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = allEvents.slice(startIndex, endIndex);
    
    const hasMore = allEvents.length > endIndex;
    
    console.log('✅ Journey events:', {
      page,
      limit,
      totalEvents: allEvents.length,
      showingEvents: paginatedEvents.length,
      startIndex,
      endIndex,
      hasMore
    });
    
    return { 
      data: paginatedEvents, 
      error: null, 
      hasMore,
      total: allEvents.length
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberJourney:', error);
    return { data: [], error: null, hasMore: false, total: 0 };
  }
}

async function testJourneyPagination() {
  console.log('🔍 Testing Journey Pagination functionality...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  // Test with contacts that have transaction data
  const testContactIds = [
    '1e1f63ae-02e5-4e54-a13e-30b5a7858008', // Kwame Mensah
    '12f2dcac-0b99-4c07-8164-0a3d4b469a16'  // Nana Yaw
  ];
  
  for (const contactId of testContactIds) {
    console.log(`\n📊 Testing journey pagination for contact: ${contactId}...`);
    
    // Get contact name
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();
    
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    console.log(`   Contact: ${contactName}`);
    
    // Test first page (should show latest 4 events)
    const page1 = await fetchMemberJourney(contactId, 1, 4);
    console.log(`   📄 Page 1: ${page1.data.length} events (should be max 4), hasMore: ${page1.hasMore}, total: ${page1.total}`);
    
    if (page1.data.length > 0) {
      console.log(`   📋 Page 1 events:`);
      page1.data.forEach((event, index) => {
        console.log(`      ${index + 1}. ${event.title} (${event.type}) - ${new Date(event.date).toLocaleDateString()}`);
      });
    }
    
    if (page1.hasMore) {
      // Test second page
      const page2 = await fetchMemberJourney(contactId, 2, 4);
      console.log(`   📄 Page 2: ${page2.data.length} events (should be max 4), hasMore: ${page2.hasMore}, total: ${page2.total}`);
      
      if (page2.data.length > 0) {
        console.log(`   📋 Page 2 events:`);
        page2.data.forEach((event, index) => {
          console.log(`      ${index + 1}. ${event.title} (${event.type}) - ${new Date(event.date).toLocaleDateString()}`);
        });
      }
      
      // Verify no duplicate IDs
      const page1Ids = new Set(page1.data.map(item => item.id));
      const page2Ids = new Set(page2.data.map(item => item.id));
      const duplicates = [...page1Ids].filter(id => page2Ids.has(id));
      
      if (duplicates.length === 0) {
        console.log('   ✅ No duplicate events between pages');
      } else {
        console.log('   ⚠️ Found duplicate events:', duplicates);
      }
      
      // Verify Page 1 events are more recent than Page 2 events
      if (page1.data.length > 0 && page2.data.length > 0) {
        const lastPage1Date = new Date(page1.data[page1.data.length - 1].date);
        const firstPage2Date = new Date(page2.data[0].date);
        
        if (lastPage1Date >= firstPage2Date) {
          console.log('   ✅ Page 1 events are more recent than Page 2 events');
        } else {
          console.log('   ⚠️ Page ordering issue: Page 2 has more recent events than Page 1');
        }
      }
    } else {
      console.log('   ℹ️ Only one page of data available');
    }
    
    // Test that pagination respects the 4-event limit
    if (page1.data.length <= 4) {
      console.log('   ✅ Page 1 respects 4-event limit');
    } else {
      console.log(`   ❌ Page 1 has ${page1.data.length} events, exceeds 4-event limit`);
    }
  }
  
  console.log('\n✨ Journey Pagination test complete!');
  console.log('\n🎯 Expected behavior:');
  console.log('   - Page 1 shows latest 4 journey events');
  console.log('   - Page 2+ shows next 4 events each');
  console.log('   - Events are sorted by date (newest first)');
  console.log('   - "Load More" button appears when hasMore is true');
}

testJourneyPagination().catch(console.error); 