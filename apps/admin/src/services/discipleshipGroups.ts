import { supabase } from '@/lib/supabase';

// Define types based on CICS Architecture Spec
export type Group = {
  id: string;
  name: string;
  type: string;
  campus_id?: string;
  leader_id?: string;
  custom_fields: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
  campus?: {
    name: string;
  };
  leader?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  member_count?: number;
};

export type GroupMembership = {
  group_id: string;
  contact_id: string;
  role: string;
  joined_at?: string;
  contacts?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
  };
};

// Fetch only groups where type = 'Discipleship'
export async function fetchDiscipleshipGroups() {
  try {
    console.log('Fetching discipleship groups');
    const { data, error, count } = await supabase
      .from('groups')
      .select(`
        *,
        member_count:group_memberships!group_id(count),
        leader:contacts!groups_leader_id_fkey(id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('type', 'Discipleship')
      .order('name');

    if (error) {
      console.error('Error fetching discipleship groups:', error);
      throw error;
    }

    // Process data to format member_count correctly
    const formattedData = data?.map(group => {
      console.log('Group before formatting:', group);
      const processed = {
        ...group,
        member_count: group.member_count?.[0]?.count || 0,
        // Ensure leader data is properly structured
        leader: group.leader || null
      };
      console.log('Group after formatting:', processed);
      return processed;
    }) || [];

    return { data: formattedData, count, error: null };
  } catch (error) {
    console.error('Exception fetching discipleship groups:', error);
    return { data: [], count: 0, error };
  }
}

export async function fetchDiscipleshipGroup(id: string) {
  try {
    console.log(`Fetching discipleship group with ID: ${id}`);
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        custom_fields,
        leader:contacts!groups_leader_id_fkey(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('type', 'Discipleship')
      .single();

    if (error) {
      console.error(`Error fetching discipleship group ${id}:`, error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Exception fetching discipleship group ${id}:`, error);
    return { data: null, error };
  }
}

export async function createDiscipleshipGroup(data: Partial<Group>) {
  try {
    console.log('Creating discipleship group with data:', data);
    const { data: createdData, error } = await supabase
      .from('groups')
      .insert({ ...data, type: 'Discipleship' })
      .select();

    if (error) {
      console.error('Error creating discipleship group:', error);
      throw error;
    }

    return { data: createdData, error: null };
  } catch (error) {
    console.error('Exception creating discipleship group:', error);
    return { data: null, error };
  }
}

export async function updateDiscipleshipGroup(id: string, data: Partial<Group>) {
  try {
    console.log(`Updating discipleship group ${id} with data:`, data);
    const { data: updatedData, error } = await supabase
      .from('groups')
      .update(data)
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error updating discipleship group ${id}:`, error);
      throw error;
    }

    return { data: updatedData, error: null };
  } catch (error) {
    console.error(`Exception updating discipleship group ${id}:`, error);
    return { data: null, error };
  }
}

export async function deleteDiscipleshipGroup(id: string) {
  try {
    console.log(`Deleting discipleship group ${id}`);
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting discipleship group ${id}:`, error);
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error(`Exception deleting discipleship group ${id}:`, error);
    return { success: false, error };
  }
}

// Memberships
export async function fetchDisciples(groupId: string) {
  try {
    console.log(`Fetching disciples for group ${groupId}`);
    const { data, error } = await supabase
      .from('group_memberships')
      .select(`
        group_id,
        contact_id,
        role,
        joined_at,
        contacts!group_memberships_contact_id_fkey(id, first_name, last_name, phone, email)
      `)
      .eq('group_id', groupId);

    if (error) {
      console.error(`Error fetching disciples for group ${groupId}:`, error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Exception fetching disciples for group ${groupId}:`, error);
    return { data: [], error };
  }
}

export async function addDisciple(groupId: string, contactId: string, role: string = 'Mentee') {
  try {
    console.log(`Adding disciple ${contactId} to group ${groupId} with role ${role}`);
    const { data, error } = await supabase
      .from('group_memberships')
      .insert({
        group_id: groupId,
        contact_id: contactId,
        role,
        joined_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error(`Error adding disciple ${contactId} to group ${groupId}:`, error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Exception adding disciple ${contactId} to group ${groupId}:`, error);
    return { data: null, error };
  }
}

export async function removeDisciple(groupId: string, contactId: string) {
  try {
    console.log(`Removing disciple ${contactId} from group ${groupId}`);
    const { error } = await supabase
      .from('group_memberships')
      .delete()
      .eq('group_id', groupId)
      .eq('contact_id', contactId);

    if (error) {
      console.error(`Error removing disciple ${contactId} from group ${groupId}:`, error);
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error(`Exception removing disciple ${contactId} from group ${groupId}:`, error);
    return { success: false, error };
  }
}

export async function updateDiscipleRole(groupId: string, contactId: string, role: string) {
  try {
    console.log(`Updating disciple ${contactId} role to ${role} in group ${groupId}`);
    const { data, error } = await supabase
      .from('group_memberships')
      .update({ role })
      .eq('group_id', groupId)
      .eq('contact_id', contactId)
      .select();

    if (error) {
      console.error(`Error updating disciple ${contactId} role in group ${groupId}:`, error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Exception updating disciple ${contactId} role in group ${groupId}:`, error);
    return { data: null, error };
  }
}

export async function addMultipleDisciples(groupId: string, contactIds: string[], role: string = 'Mentee') {
  try {
    console.log(`Adding ${contactIds.length} disciples to group ${groupId} with role ${role}`);
    
    // Create array of objects for batch insert
    const memberships = contactIds.map(contactId => ({
      group_id: groupId,
      contact_id: contactId,
      role,
      joined_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('group_memberships')
      .insert(memberships)
      .select();

    if (error) {
      console.error(`Error adding disciples to group ${groupId}:`, error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Exception adding disciples to group ${groupId}:`, error);
    return { data: null, error };
  }
}

// Get discipleship groups metrics
export async function getDiscipleshipGroupsMetrics() {
  try {
    // Get total discipleship groups
    const { count: totalGroups, error: totalError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'Discipleship');

    if (totalError) throw totalError;

    // Get active discipleship groups
    const { count: activeGroups, error: activeError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'Discipleship')
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get total disciples (members in discipleship groups)
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id')
      .eq('type', 'Discipleship');

    if (groupsError) throw groupsError;

    let totalDisciples = 0;
    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id);
      
      const { count: disciples, error: disciplesError } = await supabase
        .from('group_memberships')
        .select('*', { count: 'exact', head: true })
        .in('group_id', groupIds);
        
      if (disciplesError) throw disciplesError;
      
      totalDisciples = disciples || 0;
    }

    return {
      totalGroups: totalGroups || 0,
      activeGroups: activeGroups || 0,
      totalDisciples,
      error: null
    };
  } catch (error) {
    console.error('Error fetching discipleship groups metrics:', error);
    return {
      totalGroups: 0,
      activeGroups: 0,
      totalDisciples: 0,
      error
    };
  }
}

// Update leader role
export async function updateLeaderRole(groupId: string, contactId: string) {
  try {
    console.log(`Setting ${contactId} as leader for group ${groupId}`);
    
    // First check if this contact is already a member of the group
    const { data: existingMembership, error: checkError } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', groupId)
      .eq('contact_id', contactId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected if not a member
      console.error(`Error checking membership for ${contactId} in group ${groupId}:`, checkError);
      throw checkError;
    }
    
    // If the contact is already a member, update their role to Leader
    if (existingMembership) {
      const { data, error } = await supabase
        .from('group_memberships')
        .update({ role: 'Leader' })
        .eq('group_id', groupId)
        .eq('contact_id', contactId)
        .select();
        
      if (error) throw error;
      return { data, error: null };
    } 
    // If the contact is not a member, add them as a member with Leader role
    else {
      const { data, error } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupId,
          contact_id: contactId,
          role: 'Leader',
          joined_at: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error(`Exception updating leader role for ${contactId} in group ${groupId}:`, error);
    return { data: null, error };
  }
} 