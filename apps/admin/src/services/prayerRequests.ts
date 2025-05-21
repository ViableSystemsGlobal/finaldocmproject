import { supabase } from '@/lib/supabase';

export type PrayerRequest = {
  id: string;
  contact_id?: string;
  title: string;
  description: string;
  status: string;
  assigned_to?: string;
  submitted_at: string;
  response_notes?: string;
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
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

export function fetchPrayerRequests() {
  return supabase
    .from('prayer_requests')
    .select('id, title, status, submitted_at, contacts(id, first_name, last_name)')
    .order('submitted_at', { ascending: false });
}

export function fetchPrayerRequest(id: string) {
  return supabase
    .from('prayer_requests')
    .select('*, contacts(id, first_name, last_name, email)')
    .eq('id', id)
    .single();
}

export function createPrayerRequest(data: {
  contact_id?: string;
  title: string;
  description: string;
  status: string;
  assigned_to?: string;
  response_notes?: string;
}) {
  return supabase.from('prayer_requests').insert({
    ...data,
    submitted_at: new Date().toISOString()
  });
}

export function updatePrayerRequest(id: string, data: Partial<PrayerRequest>) {
  return supabase.from('prayer_requests').update(data).eq('id', id);
}

export function deletePrayerRequest(id: string) {
  return supabase.from('prayer_requests').delete().eq('id', id);
}

export function assignPrayerRequest(id: string, assignedTo: string) {
  return supabase
    .from('prayer_requests')
    .update({
      assigned_to: assignedTo,
      status: 'in-prayer'
    })
    .eq('id', id);
}

export function markPrayerRequestAnswered(id: string, responseNotes: string) {
  return supabase
    .from('prayer_requests')
    .update({
      status: 'answered',
      response_notes: responseNotes
    })
    .eq('id', id);
}

export async function getPrayerRequestMetrics() {
  try {
    // Get new requests
    const { count: newRequests, error: newError } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    if (newError) throw newError;

    // Get in-prayer requests
    const { count: inPrayerRequests, error: inPrayerError } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-prayer');

    if (inPrayerError) throw inPrayerError;

    // Get answered requests
    const { count: answeredRequests, error: answeredError } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'answered');

    if (answeredError) throw answeredError;

    return {
      newRequests: newRequests || 0,
      inPrayerRequests: inPrayerRequests || 0,
      answeredRequests: answeredRequests || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching prayer request metrics:', error);
    return {
      newRequests: 0,
      inPrayerRequests: 0,
      answeredRequests: 0,
      error
    };
  }
} 