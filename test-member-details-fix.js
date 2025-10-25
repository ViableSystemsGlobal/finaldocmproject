const { createClient } = require('@supabase/supabase-js');

// Create client - we'll need to provide the credentials directly for testing
async function testMemberDetails() {
  console.log('🔍 Testing member details database state...');
  
  // You'll need to replace these with your actual Supabase URL and anon key
  const supabaseUrl = 'https://ufjfafcfkalaasdhgcbi.supabase.co'; // Replace with your actual URL
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDU4MjMsImV4cCI6MjA1NDAyMTgyM30.bZPZJ1r9OyBJG9X5WdJOJ8hV0MvFMZXDwv7EwQGwm3E'; // Replace with your actual anon key
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('\n1. Testing RPC function existence...');
  try {
    const { data, error } = await supabase.rpc('get_member_all_group_memberships', { 
      p_contact_id: '00000000-0000-0000-0000-000000000000' 
    });
    
    if (error) {
      console.log('❌ RPC function error:', error.code, error.message);
    } else {
      console.log('✅ RPC function exists and returned:', data?.length || 0, 'results');
    }
  } catch (err) {
    console.log('💥 RPC function error:', err.message);
  }
  
  console.log('\n2. Checking table existence...');
  
  // Check for groups table
  try {
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, type')
      .limit(3);
    
    if (groupsError) {
      console.log('❌ groups table error:', groupsError.code, groupsError.message);
    } else {
      console.log('✅ groups table exists with', groups?.length || 0, 'records');
      if (groups?.length > 0) {
        console.log('   Sample:', groups[0]);
      }
    }
  } catch (err) {
    console.log('💥 groups table error:', err.message);
  }
  
  // Check for group_memberships table
  try {
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_memberships')
      .select('id, contact_id, group_id, role')
      .limit(3);
    
    if (membershipsError) {
      console.log('❌ group_memberships table error:', membershipsError.code, membershipsError.message);
    } else {
      console.log('✅ group_memberships table exists with', memberships?.length || 0, 'records');
      if (memberships?.length > 0) {
        console.log('   Sample:', memberships[0]);
      }
    }
  } catch (err) {
    console.log('💥 group_memberships table error:', err.message);
  }
  
  // Check for discipleship_groups table
  try {
    const { data: discGroups, error: discGroupsError } = await supabase
      .from('discipleship_groups')
      .select('id, name, status')
      .limit(3);
    
    if (discGroupsError) {
      console.log('❌ discipleship_groups table error:', discGroupsError.code, discGroupsError.message);
    } else {
      console.log('✅ discipleship_groups table exists with', discGroups?.length || 0, 'records');
      if (discGroups?.length > 0) {
        console.log('   Sample:', discGroups[0]);
      }
    }
  } catch (err) {
    console.log('💥 discipleship_groups table error:', err.message);
  }
  
  // Check for discipleship_memberships table
  try {
    const { data: discMemberships, error: discMembershipsError } = await supabase
      .from('discipleship_memberships')
      .select('id, contact_id, discipleship_group_id, role, status')
      .limit(3);
    
    if (discMembershipsError) {
      console.log('❌ discipleship_memberships table error:', discMembershipsError.code, discMembershipsError.message);
    } else {
      console.log('✅ discipleship_memberships table exists with', discMemberships?.length || 0, 'records');
      if (discMemberships?.length > 0) {
        console.log('   Sample:', discMemberships[0]);
      }
    }
  } catch (err) {
    console.log('💥 discipleship_memberships table error:', err.message);
  }
  
  console.log('\n3. Testing with a real contact ID...');
  
  // Get a real contact ID to test with
  try {
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .limit(1);
    
    if (contactsError) {
      console.log('❌ contacts table error:', contactsError.code, contactsError.message);
    } else if (contacts?.length > 0) {
      const testContactId = contacts[0].id;
      console.log('📝 Testing with contact:', contacts[0].first_name, contacts[0].last_name, '(' + testContactId + ')');
      
      // Test the RPC function with real contact
      try {
        const { data, error } = await supabase.rpc('get_member_all_group_memberships', { 
          p_contact_id: testContactId 
        });
        
        if (error) {
          console.log('❌ RPC test with real contact failed:', error.code, error.message);
        } else {
          console.log('✅ RPC test with real contact returned:', data?.length || 0, 'memberships');
          if (data?.length > 0) {
            console.log('   Sample membership:', data[0]);
          }
        }
      } catch (err) {
        console.log('💥 RPC test with real contact error:', err.message);
      }
    }
  } catch (err) {
    console.log('💥 contacts table error:', err.message);
  }
}

testMemberDetails().catch(console.error); 