import { supabase } from '@/lib/supabase';

export function fetchMembers() {
  return supabase
    .from('members')
    .select('contact_id, joined_at, notes, created_at, contacts(id, first_name, last_name, email, phone, profile_image)');
}

export function fetchMember(id: string) {
  return supabase
    .from('members')
    .select('contact_id, joined_at, notes, created_at, contacts(id, first_name, last_name, email, phone, profile_image)')
    .eq('contact_id', id)
    .single();
}

export async function createMember(data: { contact_id: string; joined_at: string; notes?: string }) {
  console.log('Creating member with data:', JSON.stringify(data, null, 2));
  
  try {
    // Note: members table does not need tenant_id, it's only in the contacts table
    // We'll keep the data as is without adding tenant_id
    
    console.log('Submitting member data:', JSON.stringify(data, null, 2));
    
    // Debug: Check if we can access the members table
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });
    
    console.log('Table check result:', tableCheckError 
      ? `Error: ${tableCheckError.message}` 
      : `Success: Table exists with ${tableCheck?.length || 0} records`);
    
    // Proceed with member creation
    const result = await supabase
      .from('members')
      .insert(data);
    
    if (result.error) {
      console.error('Error creating member:', result.error);
      console.error('Error code:', result.error.code);
      console.error('Error details:', result.error.details);
      
      // Handle specific error types
      if (result.error.code === '23505') {
        return { ...result, error: { ...result.error, message: 'This contact is already a member' } };
      }
      
      if (result.error.code === '23503') {
        return { ...result, error: { ...result.error, message: 'Invalid contact ID or contact does not exist' } };
      }
      
      if (result.error.code === '42P01') {
        return { ...result, error: { ...result.error, message: 'Table "members" does not exist - database schema issue' } };
      }
      
      // Generic database constraint error
      if (result.error.code?.startsWith('23')) {
        return { ...result, error: { ...result.error, message: `Database constraint error: ${result.error.details || result.error.message}` } };
      }
    } else {
      console.log('Member created successfully');
    }
    
    return result;
  } catch (err) {
    console.error('Unexpected error in createMember:', err);
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
  }
}

export function updateMember(contact_id: string, data: { joined_at: string; notes?: string }) {
  return supabase
    .from('members')
    .update(data)
    .eq('contact_id', contact_id);
}

export function deleteMember(contact_id: string) {
  return supabase
    .from('members')
    .delete()
    .eq('contact_id', contact_id);
}

// Helper function to get members count
export function getMembersCount() {
  return supabase
    .from('members')
    .select('contact_id', { count: 'exact', head: true });
}

// Helper function to get new members this month
export function getNewMembersThisMonth() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return supabase
    .from('members')
    .select('contact_id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());
}

// Helper function to check if a member is serving (has group membership)
export function getMembersServing() {
  return supabase.rpc('count_members_serving');
  // Note: This requires a custom PostgreSQL function:
  // CREATE FUNCTION count_members_serving() RETURNS INTEGER AS $$
  // SELECT COUNT(DISTINCT contact_id) FROM group_memberships 
  // WHERE contact_id IN (SELECT contact_id FROM members)
  // $$ LANGUAGE SQL;
}

// Helper function to get member app users count
export function getMemberAppUsers() {
  return supabase.rpc('count_member_app_users');
  // Note: This requires a custom PostgreSQL function:
  // CREATE FUNCTION count_member_app_users() RETURNS INTEGER AS $$
  // SELECT COUNT(DISTINCT contact_id) FROM mobile_app_users 
  // WHERE contact_id IN (SELECT contact_id FROM members)
  // $$ LANGUAGE SQL;
}

// Helper function to get contacts for member creation
export function getContactsNotMembers() {
  // Simpler approach to avoid subquery issues
  return supabase
    .from('contacts')
    .select('id, first_name, last_name, email, profile_image')
    .order('first_name', { ascending: true })
    .limit(100);
}

// Function to get contacts not in a specific group
export async function getContactsNotInGroup(groupId: string, searchQuery?: string) {
  try {
    // First get all contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, profile_image')
      .order('first_name', { ascending: true });
    
    if (contactsError) throw contactsError;
    
    // Then get all members of the specified group
    const { data: members, error: membersError } = await supabase
      .from('group_memberships')
      .select('contact_id')
      .eq('group_id', groupId);
    
    if (membersError) throw membersError;
    
    // Extract contact IDs that are already members
    const memberContactIds = members?.map(member => member.contact_id) || [];
    
    // Filter out contacts that are already members of this group
    const filteredContacts = contacts?.filter(contact => 
      !memberContactIds.includes(contact.id)
    ) || [];
    
    // If search query provided, filter by name or email
    let result = filteredContacts;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = filteredContacts.filter(contact => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const email = (contact.email || '').toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching contacts not in group:', error);
    return { data: [], error };
  }
} 