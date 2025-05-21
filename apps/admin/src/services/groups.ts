import { supabase } from '@/lib/supabase';

export type Group = {
  id: string;
  name: string;
  type: string;
  campus_id: string;
  custom_fields?: any;
  status: string;
  created_at: string;
  updated_at: string;
  campus?: {
    name: string;
  };
  member_count?: number;
};

export type GroupMembership = {
  group_id: string;
  contact_id: string;
  role: string;
  joined_at?: string;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };
};

// Groups CRUD
export async function fetchGroups() {
  // Use a simple query without joins or subqueries
  const { data, error } = await supabase
    .from('groups')
    .select('*');
  
  console.log('Basic groups query result:', { data, error });
  
  if (error) {
    console.error('Error fetching groups:', error);
    return { data: [], error };
  }
  
  // If we successfully got data, enrich it with campus names and member counts
  const enrichedData = await Promise.all((data || []).map(async group => {
    // Get campus name
    let campusName = 'Unknown';
    if (group.campus_id) {
      const { data: campusData } = await supabase
        .from('campuses')
        .select('name')
        .eq('id', group.campus_id)
        .single();
      
      if (campusData) {
        campusName = campusData.name;
      }
    }
    
    // Get member count
    const { count } = await supabase
      .from('group_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id);
    
    return {
      ...group,
      campus: { name: campusName },
      member_count: count || 0
    };
  }));
  
  return { data: enrichedData, error: null };
}

export function fetchGroup(id: string) {
  return supabase
    .from('groups')
    .select('*, campus:campuses(name), custom_fields')
    .eq('id', id)
    .single();
}

export function createGroup(data: Partial<Group>) {
  return supabase.from('groups').insert(data);
}

export function updateGroup(id: string, data: Partial<Group>) {
  return supabase.from('groups').update(data).eq('id', id);
}

export function deleteGroup(id: string) {
  return supabase.from('groups').delete().eq('id', id);
}

// Memberships
export function fetchMemberships(group_id: string) {
  return supabase
    .from('group_memberships')
    .select('group_id, contact_id, role, joined_at, contacts(*)')
    .eq('group_id', group_id);
}

export function addMembership(group_id: string, contact_id: string, role: string, joined_at?: string) {
  return supabase
    .from('group_memberships')
    .insert({ 
      group_id, 
      contact_id, 
      role,
      joined_at: joined_at || new Date().toISOString() 
    });
}

export function updateMembership(group_id: string, contact_id: string, data: Partial<GroupMembership>) {
  return supabase
    .from('group_memberships')
    .update(data)
    .eq('group_id', group_id)
    .eq('contact_id', contact_id);
}

export function removeMembership(group_id: string, contact_id: string) {
  return supabase
    .from('group_memberships')
    .delete()
    .eq('group_id', group_id)
    .eq('contact_id', contact_id);
}

// Helper functions for metrics
export function getGroupsCount() {
  return supabase
    .from('groups')
    .select('id', { count: 'exact', head: true });
}

export function getActiveGroupsCount() {
  return supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');
}

export function getTotalGroupMembersCount() {
  return supabase
    .rpc('get_total_group_members_count');
}

// Get campuses for dropdown
export function fetchCampuses() {
  return supabase
    .from('campuses')
    .select('id, name')
    .order('name', { ascending: true });
}

// Get contacts for member selection
export function getContactsForMemberSelection() {
  return supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, profile_image')
    .order('first_name', { ascending: true });
}

// Helper for messaging functionality - returns just the IDs
export async function fetchGroupMemberIds(group_id: string) {
  try {
    const { data, error } = await supabase
      .from('group_memberships')
      .select('contact_id')
      .eq('group_id', group_id);
    
    if (error) {
      console.error('Error fetching group member IDs:', error);
      return { data: [], error };
    }
    
    // Extract just the contact_id values into an array
    const contactIds = (data || []).map(membership => membership.contact_id);
    return { data: contactIds, error: null };
  } catch (err) {
    console.error('Unexpected error fetching group member IDs:', err);
    return { data: [], error: err };
  }
} 