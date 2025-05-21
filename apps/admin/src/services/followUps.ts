import { supabase } from '@/lib/supabase';

export type FollowUp = {
  id: string;
  contact_id: string;
  type: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  next_action_date: string;
  completed_at?: string;
  notes?: string;
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  user?: {
    id: string;
    email: string;
    raw_user_meta_data: {
      first_name?: string;
      last_name?: string;
      name?: string;
    };
  };
};

export function fetchFollowUps() {
  return supabase
    .from('follow_ups')
    .select('*, contacts(id, first_name, last_name, email, phone)')
    .order('next_action_date');
}

export function fetchFollowUp(id: string) {
  return supabase
    .from('follow_ups')
    .select('*, contacts(id, first_name, last_name, email, phone)')
    .eq('id', id)
    .single();
}

export function createFollowUp(data: {
  contact_id: string;
  type: string;
  status: string;
  assigned_to?: string;
  next_action_date: string;
  notes?: string;
}) {
  return supabase.from('follow_ups').insert(data);
}

export function updateFollowUp(id: string, data: Partial<FollowUp>) {
  return supabase.from('follow_ups').update(data).eq('id', id);
}

export function deleteFollowUp(id: string) {
  return supabase.from('follow_ups').delete().eq('id', id);
}

export function markFollowUpComplete(id: string, notes?: string) {
  return supabase
    .from('follow_ups')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: notes ? `${notes}\n\nCompleted on ${new Date().toISOString()}` : `Completed on ${new Date().toISOString()}`
    })
    .eq('id', id);
}

export function reassignFollowUp(id: string, assignedTo: string) {
  return supabase
    .from('follow_ups')
    .update({
      assigned_to: assignedTo,
      notes: `Reassigned to user ${assignedTo} on ${new Date().toISOString()}`
    })
    .eq('id', id);
}

export async function getFollowUpMetrics() {
  try {
    // Get pending follow-ups
    const { count: pendingFollowUps, error: pendingError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // Get overdue follow-ups
    const today = new Date().toISOString().split('T')[0]; // Get just the date part
    const { count: overdueFollowUps, error: overdueError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('next_action_date', today);

    if (overdueError) throw overdueError;

    // Get completed follow-ups today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const { count: completedToday, error: completedError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())
      .lte('completed_at', todayEnd.toISOString());

    if (completedError) throw completedError;

    return {
      pendingFollowUps: pendingFollowUps || 0,
      overdueFollowUps: overdueFollowUps || 0,
      completedToday: completedToday || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching follow-up metrics:', error);
    return {
      pendingFollowUps: 0,
      overdueFollowUps: 0,
      completedToday: 0,
      error
    };
  }
} 