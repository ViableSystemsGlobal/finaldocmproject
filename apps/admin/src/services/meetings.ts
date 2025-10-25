import { supabase } from '@/lib/supabase';

export type Meeting = {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  meeting_date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  meeting_type: 'regular' | 'special' | 'planning' | 'social' | 'outreach';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  max_attendees?: number;
  meeting_link?: string;
  agenda?: any[];
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export type MeetingAttendance = {
  id: string;
  meeting_id: string;
  contact_id: string;
  status: 'pending' | 'present' | 'absent' | 'excused' | 'late';
  checked_in_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    profile_image?: string;
  };
};

export type MeetingStats = {
  total_meetings: number;
  upcoming_meetings: number;
  completed_meetings: number;
  cancelled_meetings: number;
  avg_attendance: number;
};

// Meeting CRUD operations
export async function fetchGroupMeetings(groupId: string) {
  return await supabase
    .from('group_meetings')
    .select('*')
    .eq('group_id', groupId)
    .order('meeting_date', { ascending: false });
}

export async function fetchMeeting(meetingId: string) {
  return await supabase
    .from('group_meetings')
    .select('*')
    .eq('id', meetingId)
    .single();
}

export async function createMeeting(meetingData: Partial<Meeting>) {
  return await supabase
    .from('group_meetings')
    .insert(meetingData)
    .select()
    .single();
}

export async function updateMeeting(meetingId: string, meetingData: Partial<Meeting>) {
  return await supabase
    .from('group_meetings')
    .update(meetingData)
    .eq('id', meetingId)
    .select()
    .single();
}

export async function deleteMeeting(meetingId: string) {
  return await supabase
    .from('group_meetings')
    .delete()
    .eq('id', meetingId);
}

// Attendance operations
export async function fetchMeetingAttendance(meetingId: string) {
  return await supabase
    .from('meeting_attendance')
    .select(`
      *,
      contacts (
        id,
        first_name,
        last_name,
        email,
        profile_image
      )
    `)
    .eq('meeting_id', meetingId)
    .order('contacts(first_name)', { ascending: true });
}

export async function updateAttendance(attendanceId: string, status: string, notes?: string) {
  const updateData: any = { 
    status,
    checked_in_at: status === 'present' ? new Date().toISOString() : null
  };
  
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  
  return await supabase
    .from('meeting_attendance')
    .update(updateData)
    .eq('id', attendanceId);
}

export async function bulkUpdateAttendance(updates: { id: string; status: string; notes?: string }[]) {
  const promises = updates.map(update => 
    updateAttendance(update.id, update.status, update.notes)
  );
  
  return await Promise.all(promises);
}

// Statistics
export async function getMeetingStats(groupId: string): Promise<{ data: MeetingStats | null; error: any }> {
  try {
    const { data, error } = await supabase
      .rpc('get_group_meeting_stats', { p_group_id: groupId });
    
    if (error) throw error;
    
    const stats = data && data.length > 0 ? {
      total_meetings: Number(data[0].total_meetings) || 0,
      upcoming_meetings: Number(data[0].upcoming_meetings) || 0,
      completed_meetings: Number(data[0].completed_meetings) || 0,
      cancelled_meetings: Number(data[0].cancelled_meetings) || 0,
      avg_attendance: Number(data[0].avg_attendance) || 0
    } : {
      total_meetings: 0,
      upcoming_meetings: 0,
      completed_meetings: 0,
      cancelled_meetings: 0,
      avg_attendance: 0
    };
    
    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching meeting stats:', error);
    return { data: null, error };
  }
}

// Helper functions
export function getUpcomingMeetings(meetings: Meeting[]) {
  const today = new Date().toISOString().split('T')[0];
  return meetings.filter(meeting => 
    meeting.meeting_date >= today && meeting.status === 'scheduled'
  );
}

export function getPastMeetings(meetings: Meeting[]) {
  const today = new Date().toISOString().split('T')[0];
  return meetings.filter(meeting => 
    meeting.meeting_date < today || meeting.status === 'completed'
  );
}

export function formatMeetingTime(startTime: string, endTime?: string) {
  const start = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (!endTime) return start;
  
  const end = new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${start} - ${end}`;
}

export function getAttendanceRate(attendance: MeetingAttendance[]) {
  const totalMembers = attendance.length;
  const presentMembers = attendance.filter(a => a.status === 'present').length;
  
  return totalMembers > 0 ? Math.round((presentMembers / totalMembers) * 100) : 0;
}

// Meeting reminders
export async function sendMeetingReminder(meetingId: string, reminderType: string) {
  // This would integrate with the email system
  try {
    const { data: meeting } = await fetchMeeting(meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    // Get group member IDs for the meeting
    const { data: attendance } = await fetchMeetingAttendance(meetingId);
    const recipientIds = attendance?.map(a => a.contact_id) || [];
    
    if (recipientIds.length === 0) {
      throw new Error('No recipients found for reminder');
    }
    
    // Record the reminder in the database
    const { data: reminder, error: reminderError } = await supabase
      .from('meeting_reminders')
      .insert({
        meeting_id: meetingId,
        reminder_type: reminderType,
        recipients_count: recipientIds.length,
        status: 'sent'
      })
      .select()
      .single();
    
    if (reminderError) throw reminderError;
    
    // TODO: Integrate with the email system to send actual reminders
    // For now, just return success
    return { success: true, reminder };
  } catch (error) {
    console.error('Error sending meeting reminder:', error);
    return { success: false, error };
  }
} 