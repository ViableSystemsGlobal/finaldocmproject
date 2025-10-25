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
  image_url?: string;
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
export function fetchGroups() {
  return supabase
    .from('groups')
    .select(`
      *, 
      campus:campuses(name),
      group_memberships(contact_id)
    `)
    .order('created_at', { ascending: false });
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
    .eq('group_id', group_id)
    .eq('status', 'active');
}

export function addMembership(group_id: string, contact_id: string, role: string, joined_at?: string, requiresApproval: boolean = false) {
  const membershipData: any = { 
    group_id, 
    contact_id, 
    role,
    joined_at: joined_at || new Date().toISOString(),
    status: requiresApproval ? 'pending' : 'active',
    requested_at: new Date().toISOString()
  };

  // If requires approval, don't set approved_at
  if (!requiresApproval) {
    membershipData.approved_at = new Date().toISOString();
  }

  return supabase
    .from('group_memberships')
    .insert(membershipData);
}

// New function for creating approval requests specifically
export function createMembershipRequest(group_id: string, contact_id: string, role: string = 'Member') {
  return supabase
    .from('group_memberships')
    .insert({ 
      group_id, 
      contact_id, 
      role,
      status: 'pending',
      requested_at: new Date().toISOString()
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
export async function fetchGroupMemberIds(groupId: string) {
  return await supabase
    .from('group_memberships')
    .select('contact_id')
    .eq('group_id', groupId)
    .eq('status', 'active')
    .then(result => ({
      ...result,
      data: result.data?.map(item => item.contact_id) || []
    }))
}

// Function to fetch group message history
export async function fetchGroupMessages(groupId: string) {
  return await supabase
    .from('comms.messages')
    .select(`
      id,
      channel,
      content,
      subject,
      status,
      sent_count,
      error_message,
      created_at,
      updated_at,
      recipient_ids
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
}

// Function to get message statistics for a group
export async function getGroupMessageStats(groupId: string) {
  try {
    const { data: messages, error } = await fetchGroupMessages(groupId)
    
    if (error) throw error
    
    const stats = {
      total: messages?.length || 0,
      sent: 0,
      failed: 0,
      pending: 0
    }
    
    messages?.forEach(message => {
      switch (message.status) {
        case 'sent':
          stats.sent++
          break
        case 'failed':
          stats.failed++
          break
        case 'pending':
        case 'sending':
          stats.pending++
          break
      }
    })
    
    return { data: stats, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// GROUP LEADER FUNCTIONS

export type GroupLeader = {
  id: string;
  group_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by?: string;
  is_primary_leader: boolean;
  group_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
};

export type GroupPermission = {
  id: string;
  group_id: string;
  permission_type: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

// Fetch group leaders
export function fetchGroupLeaders(groupId?: string, userId?: string) {
  let query = supabase
    .from('group_leaders_view')
    .select('*')
    .order('assigned_at', { ascending: false });

  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  return query;
}

// Assign a group leader
export function assignGroupLeader(groupId: string, userId: string, isPrimary: boolean = false) {
  return supabase
    .from('group_leaders')
    .insert({
      group_id: groupId,
      user_id: userId,
      is_primary_leader: isPrimary
    });
}

// Remove a group leader
export async function removeGroupLeader(groupId: string, userId: string) {
  const response = await fetch('/api/admin/group-leaders', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      groupId,
      userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove leader');
  }

  return { data: await response.json(), error: null };
}

// Update group leader
export function updateGroupLeader(leaderId: string, data: Partial<GroupLeader>) {
  return supabase
    .from('group_leaders')
    .update(data)
    .eq('id', leaderId);
}

// Check if user is a group leader
export async function isGroupLeader(userId: string, groupId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('group_leaders')
    .select('id')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .single();

  return !error && !!data;
}

// Fetch group permissions
export function fetchGroupPermissions(groupId: string) {
  return supabase
    .from('group_permissions')
    .select('*')
    .eq('group_id', groupId)
    .order('permission_type', { ascending: true });
}

// Update group permissions
export function updateGroupPermissions(groupId: string, permissions: Array<{ permission_type: string; is_enabled: boolean }>) {
  const updates = permissions.map(perm => ({
    group_id: groupId,
    permission_type: perm.permission_type,
    is_enabled: perm.is_enabled,
    updated_at: new Date().toISOString()
  }));

  return supabase
    .from('group_permissions')
    .upsert(updates, { onConflict: 'group_id,permission_type' });
}

// Check if user has specific permission for a group
export async function hasGroupPermission(userId: string, groupId: string, permissionType: string): Promise<boolean> {
  try {
    // First check if user is a leader
    const isLeader = await isGroupLeader(userId, groupId);
    if (!isLeader) {
      // Check if user is super admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profile?.role !== 'super_admin') {
        return false;
      }
      
      // Super admin has all permissions
      return true;
    }

    // Check the specific permission
    const { data: permission } = await supabase
      .from('group_permissions')
      .select('is_enabled')
      .eq('group_id', groupId)
      .eq('permission_type', permissionType)
      .single();

    return permission?.is_enabled || false;
  } catch (error) {
    console.error('Error checking group permission:', error);
    return false;
  }
}

// Initialize default permissions for a group
export async function initializeGroupPermissions(groupId: string) {
  const defaultPermissions = [
    { permission_type: 'approve_requests', is_enabled: true },
    { permission_type: 'send_messages', is_enabled: true },
    { permission_type: 'edit_group', is_enabled: true },
    { permission_type: 'add_members', is_enabled: true },
    { permission_type: 'remove_members', is_enabled: true },
    { permission_type: 'view_analytics', is_enabled: true }
  ];

  return updateGroupPermissions(groupId, defaultPermissions);
}

// Get all groups where user is a leader
export function fetchUserLeaderGroups(userId: string) {
  return supabase
    .from('group_leaders_view')
    .select('*')
    .eq('user_id', userId)
    .order('group_name', { ascending: true });
}

// Get permission summary for a group
export function fetchGroupPermissionSummary(groupId: string) {
  return supabase
    .from('group_permissions_summary')
    .select('*')
    .eq('group_id', groupId)
    .single();
} 