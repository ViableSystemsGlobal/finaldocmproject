import { supabase } from '@/lib/supabase';

export type AttendanceEvent = {
  id: string;
  name: string;
  event_date: string;
  attendance_count?: number;
};

export type AttendanceRecord = {
  id: string;
  event_id: string;
  contact_id: string;
  check_in_time: string;
  method: string;
  campus_id: string;
  contacts?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  campuses?: {
    name: string;
  };
  events?: {
    id: string;
    name: string;
    event_date: string;
  };
  created_at: string;
  updated_at: string;
};

// The response type is handled with an inline type assertion in the fetchAttendanceEvents function

/**
 * Fetch distinct events that have attendance records
 */
export async function fetchAttendanceEvents({ 
  offset = 0, 
  limit = 10 
}: { 
  offset?: number; 
  limit?: number; 
}) {
  try {
    // Get distinct events with attendance
    // Use a simpler query approach to avoid the order by issue
    const { data, error, count } = await supabase
      .from('attendance')
      .select('event_id, events!inner(id, name, event_date)', { count: 'exact' })
      .order('event_id', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Transform the data to match our expected type
    const events: AttendanceEvent[] = [];
    if (data) {
      // Type assertion with an intersection type to handle the Supabase response
      const typedData = data as unknown as Array<{
        event_id: string;
        events: {
          id: string;
          name: string;
          event_date: string;
        };
      }>;
      
      for (const item of typedData) {
        events.push({
          id: item.events.id,
          name: item.events.name,
          event_date: item.events.event_date,
        });
      }
      
      // Sort events by event_date in descending order (most recent first)
      events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    }

    return { data: events, count, error: null };
  } catch (error) {
    // Format error for better debugging
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error fetching attendance events';
    
    console.error('Error fetching attendance events:', error);
    return { data: [], count: 0, error: { message: errorMessage } };
  }
}

/**
 * Get attendance metrics (total check-ins, unique attendees, avg per event)
 */
export async function getAttendanceMetrics() {
  try {
    // Total check-ins
    const { count: totalCheckIns, error: countError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true });
      
    if (countError) throw countError;
    
    // Unique attendees (count distinct contact_ids)
    const { data: uniqueData, error: uniqueError } = await supabase
      .from('attendance')
      .select('contact_id')
      .limit(1000);
      
    if (uniqueError) throw uniqueError;
    
    // Use a Set to count unique contact_ids
    const uniqueAttendees = uniqueData ? 
      new Set(uniqueData.map(record => record.contact_id)).size : 0;
    
    // Distinct events with attendance
    const { data: eventData, error: eventError } = await supabase
      .from('attendance')
      .select('event_id')
      .limit(1000);
      
    if (eventError) throw eventError;
    
    // Use a Set to count unique event_ids
    const eventCount = eventData ? 
      new Set(eventData.map(record => record.event_id)).size : 0;
    
    // Calculate average
    const avgAttendance = eventCount > 0 
      ? Math.round((totalCheckIns || 0) / eventCount) 
      : 0;
    
    return { 
      totalCheckIns: totalCheckIns || 0, 
      uniqueAttendees, 
      avgAttendance,
      error: null 
    };
  } catch (error) {
    console.error('Error fetching attendance metrics:', error);
    return { 
      totalCheckIns: 0, 
      uniqueAttendees: 0, 
      avgAttendance: 0,
      error 
    };
  }
}

/**
 * Fetch attendance records for a specific event
 */
export async function fetchAttendanceByEvent(eventId: string) {
  try {
    console.log(`Fetching attendance for event ID: ${eventId}`);
    
    // First check if the event exists
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, name, event_date')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      console.log(`Event check result:`, { error: eventError });
      if (eventError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(`Event check failed: ${eventError.message}`);
      } else {
        console.log(`No event found with ID ${eventId}`);
        // Return empty data for non-existent events
        return { data: [], error: null };
      }
    } else {
      console.log(`Found event:`, eventData);
    }
    
    // Try a simpler query first to see if we can access the attendance table
    try {
      const { count, error: countError } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
        
      console.log(`Count check result:`, { count, error: countError });
      
      if (countError) {
        throw new Error(`Basic attendance count failed: ${countError.message}`);
      }
    } catch (countErr) {
      console.error('Error in count check:', countErr);
      throw countErr;
    }
    
    // Now try the full query with joins
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id, event_id, contact_id, check_in_time, method, campus_id,
          contacts(id, first_name, last_name, email, phone),
          campuses(name)
        `)
        .eq('event_id', eventId)
        .order('check_in_time', { ascending: false });
        
      console.log(`Full query result stats:`, { 
        recordCount: data?.length || 0, 
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (queryErr) {
      console.error('Error in main attendance query:', queryErr);
      throw queryErr;
    }
  } catch (error) {
    // Ensure we have a useful error message with details
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error fetching attendance data';
    
    // Log the full error with stack trace if available
    if (error instanceof Error && error.stack) {
      console.error(`Stack trace for event ${eventId}:`, error.stack);
    }
    
    console.error(`Error fetching attendance for event ${eventId}:`, error);
    return { data: [], error: { message: errorMessage, original: error } };
  }
}

/**
 * Delete an attendance record
 */
export async function deleteAttendance(id: string) {
  try {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting attendance record ${id}:`, error);
    return { success: false, error };
  }
}

/**
 * Update an attendance record
 */
export async function updateAttendance(id: string, data: Partial<AttendanceRecord>) {
  try {
    const { error } = await supabase
      .from('attendance')
      .update(data)
      .eq('id', id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error updating attendance record ${id}:`, error);
    return { success: false, error };
  }
}

/**
 * Fetch a single attendance record by ID
 */
export async function fetchAttendanceById(id: string) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        contacts(id, first_name, last_name, email, phone),
        campuses(name),
        events(id, name, event_date)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
      
    return { data, error: null };
  } catch (error) {
    // Format error with useful details
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error fetching attendance record';
    
    console.error(`Error fetching attendance record ${id}:`, error);
    return { data: null, error: { message: errorMessage } };
  }
} 