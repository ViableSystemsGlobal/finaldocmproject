import { supabase } from '@/lib/supabase';

// Define types for discipleship-specific functionality
export type DiscipleshipGroup = {
  id: string;
  name: string;
  description?: string;
  leader_id?: string;
  campus_id?: string;
  status: string;
  meeting_schedule?: string;
  meeting_location?: string;
  age_group?: string;
  curriculum?: string;
  max_capacity?: number;
  custom_fields: Record<string, any>;
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

export type DiscipleshipMembership = {
  id: string;
  discipleship_group_id: string;
  contact_id: string;
  role: string;
  joined_at: string;
  status: string;
  notes?: string;
  contacts?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
  };
};

// Fetch discipleship groups using dedicated table
export async function fetchDiscipleshipGroups() {
  try {
    console.log('Fetching discipleship groups from dedicated table');
    
    // Use the helper function for efficient querying
    const { data, error } = await supabase.rpc('get_discipleship_groups_with_counts');

    if (error) {
      console.error('Error fetching discipleship groups:', error);
      throw error;
    }

    // Enrich with campus and leader data
    const enrichedData = await Promise.all((data || []).map(async (group: any) => {
      // Get campus name
      let campus = null;
      if (group.campus_id) {
        const { data: campusData } = await supabase
          .from('campuses')
          .select('name')
          .eq('id', group.campus_id)
          .single();
        
        if (campusData) {
          campus = { name: campusData.name };
        }
      }

      // Get leader info
      let leader = null;
      if (group.leader_id) {
        const { data: leaderData } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email')
          .eq('id', group.leader_id)
          .single();
        
        if (leaderData) {
          leader = leaderData;
        }
      }

      return {
        ...group,
        campus,
        leader
      };
    }));

    return { data: enrichedData, count: enrichedData.length, error: null };
  } catch (error) {
    console.error('Exception fetching discipleship groups:', error);
    return { data: [], count: 0, error };
  }
}

export async function fetchDiscipleshipGroup(id: string) {
  try {
    console.log(`Fetching discipleship group with ID: ${id}`);
    const { data, error } = await supabase
      .from('discipleship_groups')
      .select(`
        *,
        leader:contacts(id, first_name, last_name, email),
        campus:campuses(id, name)
      `)
      .eq('id', id)
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

export async function createDiscipleshipGroup(data: Partial<DiscipleshipGroup>) {
  try {
    console.log('Creating discipleship group with data:', data);
    const { data: createdData, error } = await supabase
      .from('discipleship_groups')
      .insert(data)
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

export async function updateDiscipleshipGroup(id: string, data: Partial<DiscipleshipGroup>) {
  try {
    console.log(`Updating discipleship group ${id} with data:`, data);
    const { data: updatedData, error } = await supabase
      .from('discipleship_groups')
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
      .from('discipleship_groups')
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

// Discipleship-specific memberships
export async function fetchDisciples(groupId: string) {
  try {
    console.log(`Fetching disciples for group ${groupId}`);
    const { data, error } = await supabase
      .from('discipleship_memberships')
      .select(`
        id,
        discipleship_group_id,
        contact_id,
        role,
        joined_at,
        status,
        notes,
        contacts(id, first_name, last_name, phone, email)
      `)
      .eq('discipleship_group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

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

export async function addDisciple(groupId: string, contactId: string, role: string = 'mentee') {
  try {
    console.log(`Adding disciple ${contactId} to group ${groupId} with role ${role}`);
    const { data, error } = await supabase
      .from('discipleship_memberships')
      .insert({
        discipleship_group_id: groupId,
        contact_id: contactId,
        role,
        joined_at: new Date().toISOString(),
        status: 'active'
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
      .from('discipleship_memberships')
      .delete()
      .eq('discipleship_group_id', groupId)
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
      .from('discipleship_memberships')
      .update({ role })
      .eq('discipleship_group_id', groupId)
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

export async function addMultipleDisciples(groupId: string, contactIds: string[], role: string = 'mentee') {
  try {
    console.log(`Adding ${contactIds.length} disciples to group ${groupId} with role ${role}`);
    
    // Create array of objects for batch insert
    const memberships = contactIds.map(contactId => ({
      discipleship_group_id: groupId,
      contact_id: contactId,
      role,
      joined_at: new Date().toISOString(),
      status: 'active'
    }));
    
    const { data, error } = await supabase
      .from('discipleship_memberships')
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

// Helper function for setting leader role (now simplified)
export async function updateLeaderRole(groupId: string, leaderId: string) {
  try {
    console.log(`Setting leader ${leaderId} for group ${groupId}`);
    
    // Update the group's leader_id
    const { error: groupError } = await supabase
      .from('discipleship_groups')
      .update({ leader_id: leaderId })
      .eq('id', groupId);

    if (groupError) {
      console.error(`Error setting group leader:`, groupError);
      throw groupError;
    }

    // Check if the leader is already a member of the group
    const { data: existingMembership, error: checkError } = await supabase
      .from('discipleship_memberships')
      .select('id, role')
      .eq('discipleship_group_id', groupId)
      .eq('contact_id', leaderId)
      .eq('status', 'active')
      .maybeSingle();

    if (checkError) {
      console.error(`Error checking existing membership:`, checkError);
      throw checkError;
    }

    if (existingMembership) {
      // Update existing membership to leader role
      const { error: updateError } = await supabase
        .from('discipleship_memberships')
        .update({ 
          role: 'Leader',
          status: 'active'
        })
        .eq('id', existingMembership.id);

      if (updateError) {
        console.error(`Error updating leader membership:`, updateError);
        throw updateError;
      }
    } else {
      // Create new membership for the leader
      const { error: insertError } = await supabase
        .from('discipleship_memberships')
        .insert({
          discipleship_group_id: groupId,
          contact_id: leaderId,
          role: 'Leader',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`Error creating leader membership:`, insertError);
        throw insertError;
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error(`Exception setting leader role:`, error);
    return { success: false, error };
  }
}

// Get discipleship groups metrics
export async function getDiscipleshipGroupsMetrics() {
  try {
    // Get total discipleship groups
    const { count: totalGroups, error: totalError } = await supabase
      .from('discipleship_groups')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get active discipleship groups
    const { count: activeGroups, error: activeError } = await supabase
      .from('discipleship_groups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get total disciples
    const { count: totalDisciples, error: disciplesError } = await supabase
      .from('discipleship_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (disciplesError) throw disciplesError;

    return {
      totalGroups: totalGroups || 0,
      activeGroups: activeGroups || 0,
      totalDisciples: totalDisciples || 0,
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

// Meeting-related types and functions
export type DiscipleshipMeeting = {
  id: string;
  discipleship_group_id: string;
  title: string;
  description?: string;
  meeting_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  meeting_type: 'regular' | 'special' | 'planning' | 'social' | 'outreach';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  agenda?: any[];
  notes?: string;
  attendance_count?: number;
  created_at: string;
  updated_at: string;
};

export type MeetingAttendance = {
  id: string;
  meeting_id: string;
  contact_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checked_in_at?: string;
  notes?: string;
  contacts?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
};

// Fetch upcoming meetings for a discipleship group
export async function fetchUpcomingMeetings(groupId: string, limit: number = 5) {
  try {
    console.log(`Fetching upcoming meetings for group ${groupId}`);
    
    const { data, error } = await supabase
      .from('discipleship_meetings')
      .select(`
        *,
        attendance:discipleship_meeting_attendance(count)
      `)
      .eq('discipleship_group_id', groupId)
      .gte('meeting_date', new Date().toISOString().split('T')[0])
      .order('meeting_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error(`Error fetching upcoming meetings for group ${groupId}:`, error);
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error(`Exception fetching upcoming meetings for group ${groupId}:`, error);
    return { data: [], error };
  }
}

// Fetch recent meetings for a discipleship group
export async function fetchRecentMeetings(groupId: string, limit: number = 5) {
  try {
    console.log(`Fetching recent meetings for group ${groupId}`);
    
    const { data, error } = await supabase
      .from('discipleship_meetings')
      .select(`
        *,
        attendance:discipleship_meeting_attendance(count)
      `)
      .eq('discipleship_group_id', groupId)
      .lt('meeting_date', new Date().toISOString().split('T')[0])
      .order('meeting_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching recent meetings for group ${groupId}:`, error);
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error(`Exception fetching recent meetings for group ${groupId}:`, error);
    return { data: [], error };
  }
}

// Create a new discipleship meeting
export async function createDiscipleshipMeeting(meetingData: Partial<DiscipleshipMeeting>) {
  try {
    console.log('Creating discipleship meeting:', meetingData);
    
    const { data, error } = await supabase
      .from('discipleship_meetings')
      .insert(meetingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating discipleship meeting:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception creating discipleship meeting:', error);
    return { data: null, error };
  }
}

// Get next meeting based on regular schedule
export async function getNextScheduledMeeting(groupId: string) {
  try {
    console.log(`Getting next scheduled meeting for group ${groupId}`);
    
    // First get the group's meeting schedule
    const { data: group, error: groupError } = await supabase
      .from('discipleship_groups')
      .select('custom_fields')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    const schedule = group?.custom_fields;
    if (!schedule?.meeting_day) {
      return { data: null, error: null };
    }

    // Calculate next meeting date based on schedule
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = daysOfWeek.indexOf(schedule.meeting_day);
    
    if (targetDay === -1) {
      return { data: null, error: null };
    }

    const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
    const nextMeetingDate = new Date(today);
    nextMeetingDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));

    const nextMeeting = {
      title: 'Regular Discipleship Meeting',
      meeting_date: nextMeetingDate.toISOString().split('T')[0],
      start_time: schedule.meeting_time || '19:00',
      location: schedule.meeting_location || 'TBD',
      meeting_type: 'regular' as const,
      status: 'scheduled' as const
    };

    return { data: nextMeeting, error: null };
  } catch (error) {
    console.error(`Exception getting next scheduled meeting for group ${groupId}:`, error);
    return { data: null, error };
  }
}

// Fetch meeting attendance for a specific meeting
export async function fetchMeetingAttendance(meetingId: string) {
  try {
    console.log(`Fetching attendance for meeting ${meetingId}`);
    
    const { data, error } = await supabase
      .from('discipleship_meeting_attendance')
      .select(`
        *,
        contacts(id, first_name, last_name, email)
      `)
      .eq('meeting_id', meetingId)
      .order('checked_in_at', { ascending: false });

    if (error) {
      console.error(`Error fetching attendance for meeting ${meetingId}:`, error);
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error(`Exception fetching attendance for meeting ${meetingId}:`, error);
    return { data: [], error };
  }
}

// Update meeting attendance
export async function updateMeetingAttendance(meetingId: string, contactId: string, status: string, notes?: string) {
  try {
    console.log(`Updating attendance for meeting ${meetingId}, contact ${contactId}`);
    
    const attendanceData = {
      meeting_id: meetingId,
      contact_id: contactId,
      status,
      notes,
      checked_in_at: status === 'present' || status === 'late' ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from('discipleship_meeting_attendance')
      .upsert(attendanceData, {
        onConflict: 'meeting_id,contact_id'
      })
      .select()
      .single();

    if (error) {
      console.error(`Error updating attendance:`, error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Exception updating attendance:`, error);
    return { data: null, error };
  }
} 