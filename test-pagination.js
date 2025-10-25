require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Import the pagination functions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the paginated fetchMemberFollowUps function
async function fetchMemberFollowUps(contactId, page = 1, limit = 10) {
  try {
    console.log('🔍 Fetching follow-ups for contact:', contactId, `(page ${page}, limit ${limit})`);
    
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('follow_ups')
      .select('id, type, notes, scheduled_date, completed_at, completed, priority, created_at', { count: 'exact' })
      .eq('contact_id', contactId)
      .order('scheduled_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('⚠️ Error fetching follow-ups:', error.message);
      return { data: [], error: null, hasMore: false, total: 0 };
    }

    console.log('✅ Follow-ups found:', data?.length || 0, 'of', count, 'total');
    
    const transformedData = data?.map(followUp => ({
      id: followUp.id,
      type: followUp.type,
      notes: followUp.notes || '',
      created_at: followUp.created_at,
      scheduled_date: followUp.scheduled_date,
      completed_at: followUp.completed_at,
      completed: followUp.completed || false,
      priority: followUp.priority || 'medium'
    })) || [];

    const hasMore = (count || 0) > offset + limit;

    return { 
      data: transformedData, 
      error: null, 
      hasMore,
      total: count || 0
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberFollowUps:', error);
    return { data: [], error: null, hasMore: false, total: 0 };
  }
}

async function testPagination() {
  console.log('🔍 Testing Pagination functionality...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  // Test pagination for specific contacts
  const testContactIds = [
    '1e1f63ae-02e5-4e54-a13e-30b5a7858008', // Kwame Mensah
    '12f2dcac-0b99-4c07-8164-0a3d4b469a16'  // Nana Yaw
  ];
  
  for (const contactId of testContactIds) {
    console.log(`\n📊 Testing pagination for contact: ${contactId}...`);
    
    // Get contact name
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();
    
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    console.log(`   Contact: ${contactName}`);
    
    // Test first page
    const page1 = await fetchMemberFollowUps(contactId, 1, 5); // Small limit to test pagination
    console.log(`   📄 Page 1: ${page1.data.length} items, hasMore: ${page1.hasMore}, total: ${page1.total}`);
    
    if (page1.hasMore) {
      // Test second page
      const page2 = await fetchMemberFollowUps(contactId, 2, 5);
      console.log(`   📄 Page 2: ${page2.data.length} items, hasMore: ${page2.hasMore}, total: ${page2.total}`);
      
      // Verify no duplicate IDs
      const page1Ids = new Set(page1.data.map(item => item.id));
      const page2Ids = new Set(page2.data.map(item => item.id));
      const duplicates = [...page1Ids].filter(id => page2Ids.has(id));
      
      if (duplicates.length === 0) {
        console.log('   ✅ No duplicate items between pages');
      } else {
        console.log('   ⚠️ Found duplicate items:', duplicates);
      }
    } else {
      console.log('   ℹ️ Only one page of data available');
    }
  }
  
  console.log('\n✨ Pagination test complete!');
  console.log('\n🎯 The member details page should now:');
  console.log('   - Show total counts in tab headers');
  console.log('   - Display "Showing X of Y" counters');
  console.log('   - Include "Load More" buttons when there\'s additional data');
  console.log('   - Load data progressively to improve performance');
}

testPagination().catch(console.error); 