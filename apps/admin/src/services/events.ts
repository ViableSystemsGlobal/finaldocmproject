import { supabase } from '@/lib/supabase'
import { autoGenerateRecurringEvents } from '@/lib/auto-recurring-events';

export type Event = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  location_data?: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  capacity: number | null;
  event_date: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_end: string | null;
  recurrence_count: number | null;
  created_at: string;
  updated_at: string;
  status?: string;
  parent_event_id?: string | null;
};

export type EventImage = {
  id: string;
  event_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
};

export type Registration = {
  id: string;
  event_id: string;
  contact_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    profile_image: string | null;
  };
};

export type Invitation = {
  id: string;
  event_id: string;
  recipient_contact_id: string;
  channel: string | null;
  sent_at: string | null;
  status: string;
  created_at: string;
};

export type EventException = {
  id: string;
  event_id: string;
  occurrence_date: string;
  override_data: any;
  created_at: string;
};

// Event CRUD operations
export async function fetchEvents() {
  try {
    console.log('fetchEvents: Attempting to fetch events from Supabase');
    
    // Note: Auto-generation removed from here - it was causing slow loads
    // and would recreate deleted events. It now runs only on website.
    
    const response = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false});
    
    if (response.error) {
      console.error('fetchEvents error:', response.error);
      throw response.error;
    }
    
    console.log(`fetchEvents: Successfully fetched ${response.data?.length || 0} events`);
    return response;
  } catch (error) {
    console.error('fetchEvents exception:', error);
    throw error;
  }
}

// Fetch events with their primary image (paginated)
export async function fetchEventsWithImages(options?: {
  page?: number;
  limit?: number;
  search?: string;
  recurringFilter?: string;
}) {
  try {
    // Note: Auto-generation removed from admin for performance
    // It only runs on the public website now
    
    const { page = 1, limit = 10, search, recurringFilter } = options || {};
    const offset = (page - 1) * limit;
    
    console.log(`fetchEventsWithImages: Fetching page ${page} (${limit} per page, offset ${offset})`);
    console.log('fetchEventsWithImages: Options:', { page, limit, search, recurringFilter });
    
    // Test basic connection first
    console.log('🔍 Testing basic database connection...');
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Basic connection test failed:', testError);
      console.error('Error details:', JSON.stringify(testError, null, 2));
      
      // Try to return a fallback response instead of throwing
      console.log('🔄 Attempting fallback response...');
      return { 
        data: [], 
        error: testError,
        count: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
    }
    
    console.log('✅ Basic connection test successful');
    
    // Build the query
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: false });
    
    console.log('📊 Base query constructed');
    
    // Apply search filter
    if (search && search.trim()) {
      console.log('🔍 Applying search filter:', search);
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    // Apply recurring filter
    if (recurringFilter && recurringFilter !== 'all') {
      const isRecurring = recurringFilter === 'recurring';
      console.log('🔄 Applying recurring filter:', { recurringFilter, isRecurring });
      query = query.eq('is_recurring', isRecurring);
    }
    
    // Apply pagination
    console.log('📄 Applying pagination:', { offset, limit });
    query = query.range(offset, offset + limit - 1);
    
    console.log('🚀 Executing query...');
    
    // First, fetch events with pagination
    const { data: events, error: eventsError, count } = await query;
    
    if (eventsError) {
      console.error('fetchEventsWithImages error:', eventsError);
      console.error('Error type:', typeof eventsError);
      console.error('Error keys:', Object.keys(eventsError));
      console.error('Error details:', JSON.stringify(eventsError, null, 2));
      
      // Handle specific pagination error (PGRST103 - Requested range not satisfiable)
      if (eventsError.code === 'PGRST103' && eventsError.message === 'Requested range not satisfiable') {
        console.log('🔄 Pagination error detected - trying to fetch page 1 instead...');
        
        // Retry with page 1 if the requested page is out of range
        try {
          const retryQuery = supabase
            .from('events')
            .select('*', { count: 'exact' })
            .order('event_date', { ascending: false })
            .range(0, (limit || 10) - 1); // Page 1
          
          const { data: retryData, error: retryError, count: retryCount } = await retryQuery;
          
          if (retryError) {
            console.error('Retry query also failed:', retryError);
            return { 
              data: [], 
              error: eventsError,
              count: 0,
              page: 1,
              limit: limit || 10,
              totalPages: 0
            };
          }
          
          console.log('✅ Retry successful - returning page 1 data');
          return { 
            data: retryData || [], 
            error: null,
            count: retryCount || 0,
            page: 1, // Return page 1 instead of requested page
            limit: limit || 10,
            totalPages: Math.ceil((retryCount || 0) / (limit || 10))
          };
          
        } catch (retryException) {
          console.error('Retry exception:', retryException);
        }
      }
      
      // Return error response for other errors
      console.log('🔄 Returning error response instead of throwing...');
      return { 
        data: [], 
        error: eventsError,
        count: 0,
        page: page || 1,
        limit: limit || 10,
        totalPages: 0
      };
    }
    
    if (!events || events.length === 0) {
      console.log('No events found');
      return { data: [], error: null };
    }
    
    // Get all event IDs
    const eventIds = events.map(event => event.id);
    
    // Fetch all images for these events
    const { data: images, error: imagesError } = await supabase
      .from('event_images')
      .select('*')
      .in('event_id', eventIds)
      .order('sort_order', { ascending: true });
    
    if (imagesError) {
      console.error('fetchEventsWithImages images error:', imagesError);
      // Continue anyway, we'll just return events without images
    }
    
    // Create a map of event_id to primary image
    const imageMap = new Map();
    if (images && images.length > 0) {
      // Group images by event_id
      const imagesByEvent = images.reduce((acc, img) => {
        if (!acc[img.event_id]) {
          acc[img.event_id] = [];
        }
        acc[img.event_id].push(img);
        return acc;
      }, {});
      
      // Get primary image (first one) for each event
      Object.keys(imagesByEvent).forEach(eventId => {
        imageMap.set(eventId, imagesByEvent[eventId][0]);
      });
    }
    
    // Combine events with their primary image
    const eventsWithImages = events.map(event => ({
      ...event,
      primary_image: imageMap.get(event.id) || null
    }));
    
    console.log(`fetchEventsWithImages: Successfully fetched ${eventsWithImages.length} events with ${imageMap.size} images (total: ${count})`);
    return { 
      data: eventsWithImages, 
      error: null,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('fetchEventsWithImages exception:', error);
    
    // Return error response instead of throwing
    console.log('🔄 Returning exception response instead of throwing...');
    return { 
      data: [], 
      error: error,
      count: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };
  }
}

export async function fetchEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

// Alias for consistency with other services
export const fetchEventById = fetchEvent;

export async function createEvent(data: Partial<Event>) {
  try {
    console.log('createEvent: Attempting to create event with data:', data);
    const response = await supabase
      .from('events')
      .insert(data);
    
    if (response.error) {
      console.error('createEvent error:', response.error);
      throw response.error;
    }
    
    console.log('createEvent: Successfully created event', response.data);
    return response;
  } catch (error) {
    console.error('createEvent exception:', error);
    throw error;
  }
}

export async function updateEvent(id: string, data: Partial<Event>) {
  try {
    console.log(`updateEvent: Updating event ${id}`, data);
    const response = await supabase
      .from('events')
      .update(data)
      .eq('id', id);
    
    if (response.error) {
      console.error('updateEvent error:', response.error);
      throw response.error;
    }
    
    console.log('updateEvent: Successfully updated event', response.data);
    return response;
  } catch (error) {
    console.error('updateEvent exception:', error);
    throw error;
  }
}

export async function deleteEvent(id: string) {
  try {
    console.log(`deleteEvent: Attempting to delete event ${id}`);
    
    // First delete related images
    const { error: imagesError } = await supabase
      .from('event_images')
      .delete()
      .eq('event_id', id);
    
    if (imagesError) {
      console.error('deleteEvent images error:', {
        message: imagesError.message,
        details: imagesError.details,
        hint: imagesError.hint,
        code: imagesError.code
      });
      // Continue anyway
    }
    
    // Delete registrations
    const { error: registrationsError } = await supabase
      .from('registrations')
      .delete()
      .eq('event_id', id);
    
    if (registrationsError) {
      console.error('deleteEvent registrations error:', {
        message: registrationsError.message,
        details: registrationsError.details,
        hint: registrationsError.hint,
        code: registrationsError.code
      });
      // Continue anyway
    }
    
    // Delete invitations
    const { error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .eq('event_id', id);
    
    if (invitationsError) {
      console.error('deleteEvent invitations error:', {
        message: invitationsError.message,
        details: invitationsError.details,
        hint: invitationsError.hint,
        code: invitationsError.code
      });
      // Continue anyway
    }
    
    // Delete transport requests
    const { error: transportError } = await supabase
      .from('transport_requests')
      .delete()
      .eq('event_id', id);
    
    if (transportError) {
      console.error('deleteEvent transport requests error:', {
        message: transportError.message,
        details: transportError.details,
        hint: transportError.hint,
        code: transportError.code
      });
      // Continue anyway
    }
    
    // Delete transport routes
    const { error: routesError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('event_id', id);
    
    if (routesError) {
      console.error('deleteEvent transport routes error:', {
        message: routesError.message,
        details: routesError.details,
        hint: routesError.hint,
        code: routesError.code
      });
      // Continue anyway
    }
    
    // Delete event tasks (and their assignments will be cascade deleted)
    const { error: tasksError } = await supabase
      .from('event_tasks')
      .delete()
      .eq('event_id', id);
    
    if (tasksError) {
      console.error('deleteEvent event tasks error:', {
        message: tasksError.message,
        details: tasksError.details,
        hint: tasksError.hint,
        code: tasksError.code
      });
      // Continue anyway
    }
    
    // Finally delete the event itself
    const response = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (response.error) {
      console.error('deleteEvent error:', {
        message: response.error.message,
        details: response.error.details,
        hint: response.error.hint,
        code: response.error.code
      });
      throw new Error(`Failed to delete event: ${response.error.message || 'Unknown error'}`);
    }
    
    console.log('deleteEvent: Successfully deleted event and related data');
    return response;
  } catch (error) {
    console.error('deleteEvent exception:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    throw error;
  }
}

// Event images operations
export async function fetchEventImages(event_id: string) {
  try {
    console.log(`fetchEventImages: Fetching images for event ${event_id}`);
    const response = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', event_id)
      .order('sort_order', { ascending: true });
    
    if (response.error) {
      console.error('fetchEventImages error:', response.error);
    } else {
      console.log(`fetchEventImages: Successfully fetched ${response.data?.length || 0} images`);
    }
    
    return response;
  } catch (error) {
    console.error(`fetchEventImages exception for event ${event_id}:`, error);
    throw error;
  }
}

export async function addEventImage(data: Partial<EventImage>) {
  try {
    console.log('addEventImage: Adding image with data:', data);
    const response = await supabase
      .from('event_images')
      .insert(data)
      .select();
    
    if (response.error) {
      console.error('addEventImage error:', response.error);
    } else {
      console.log('addEventImage: Successfully added image, response:', response.data);
    }
    
    return response;
  } catch (error) {
    console.error('addEventImage exception:', error);
    throw error;
  }
}

export async function deleteEventImage(id: string) {
  return supabase
    .from('event_images')
    .delete()
    .eq('id', id);
}

// Registrations operations
export async function fetchRegistrations(event_id: string) {
  return supabase
    .from('registrations')
    .select('*, contacts(*)')
    .eq('event_id', event_id);
}

export async function addRegistration(data: Partial<Registration>) {
  return supabase
    .from('registrations')
    .insert(data);
}

export async function updateRegistration(id: string, data: Partial<Registration>) {
  return supabase
    .from('registrations')
    .update(data)
    .eq('id', id);
}

export async function deleteRegistration(id: string) {
  return supabase
    .from('registrations')
    .delete()
    .eq('id', id);
}

// Invitations operations
export async function fetchInvitations(event_id: string) {
  return supabase
    .from('invitations')
    .select('*, contacts(*)')
    .eq('event_id', event_id);
}

export async function addInvitation(data: Partial<Invitation>) {
  return supabase
    .from('invitations')
    .insert(data);
}

export async function updateInvitation(id: string, data: Partial<Invitation>) {
  return supabase
    .from('invitations')
    .update(data)
    .eq('id', id);
}

export async function deleteInvitation(id: string) {
  return supabase
    .from('invitations')
    .delete()
    .eq('id', id);
}

// Metrics operations
export async function getTotalEventsCount() {
  return supabase
    .from('events')
    .select('id', { count: 'exact', head: true });
}

export async function getUpcomingEventsCount() {
  const today = new Date().toISOString();
  return supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .gte('event_date', today);
}

export async function getRecurringEventsCount() {
  return supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('is_recurring', true);
}

export async function getTodaysEventsCount() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
  
  return supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .gte('event_date', startOfDay)
    .lte('event_date', endOfDay);
}

/**
 * Upload an event image to Supabase Storage
 */
export async function uploadEventImage(eventId: string, file: File): Promise<string> {
  try {
    console.log('=== Starting event image upload ===');
    console.log('Event ID:', eventId);
    console.log('File type:', file.type, 'size:', Math.round(file.size / 1024), 'KB');
    
    // Create a unique filename with timestamp and random string
    const fileExt = file.name.split('.').pop();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = `event-${eventId}-${Date.now()}-${randomId}.${fileExt}`;
    
    // Upload to 'event-images' bucket
    console.log('Uploading file to path:', fileName);
    
    // First try direct upload
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error('Error uploading event image:', error);
      
      // Create a fallback server-side upload path if needed
      // For now, just throw the error
      throw error;
    }
    
    console.log('File uploaded successfully:', data);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }
    
    const publicUrl = urlData.publicUrl;
    console.log('Image uploaded successfully, public URL:', publicUrl);
    
    // Save image to event_images table
    console.log('Saving image to event_images table with data:', {
      event_id: eventId,
      url: publicUrl,
      alt_text: file.name,
      sort_order: 0
    });
    
    const { data: insertData, error: insertError } = await addEventImage({
      event_id: eventId,
      url: publicUrl,
      alt_text: file.name,
      sort_order: 0
    });
    
    if (insertError) {
      console.error('Error saving image to database:', insertError);
      throw insertError;
    }
    
    console.log('Image record saved to database:', insertData);
    
    return publicUrl;
  } catch (err) {
    console.error('Event image upload failed:', err);
    throw err;
  }
} 

// Debug function to test database connectivity
export async function debugEventsTable() {
  try {
    console.log('🔍 DEBUG: Testing database connection...');
    
    // Test basic connection
    const { data: testConnection, error: connectionError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return { success: false, error: connectionError };
    }
    
    console.log('✅ Database connection successful');
    
    // Test table structure
    const { data: tableStructure, error: structureError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Table structure test failed:', structureError);
      return { success: false, error: structureError };
    }
    
    console.log('✅ Table structure test successful');
    console.log('📊 Sample data:', tableStructure);
    
    // Test count
    const { count, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count test failed:', countError);
      return { success: false, error: countError };
    }
    
    console.log('✅ Count test successful:', count);
    
    // Test the exact query that's failing in fetchEventsWithImages
    console.log('🔍 Testing fetchEventsWithImages query...');
    
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: false });
    
    // Apply pagination like in the original function
    query = query.range(0, 9); // First 10 items
    
    console.log('🚀 Executing fetchEventsWithImages-like query...');
    const { data: eventsData, error: eventsError, count: eventsCount } = await query;
    
    if (eventsError) {
      console.error('❌ fetchEventsWithImages-like query failed:', eventsError);
      console.error('Error type:', typeof eventsError);
      console.error('Error keys:', Object.keys(eventsError));
      console.error('Error details:', JSON.stringify(eventsError, null, 2));
      return { success: false, error: eventsError };
    }
    
    console.log('✅ fetchEventsWithImages-like query successful');
    console.log('📊 Events data:', eventsData?.length, 'events found');
    console.log('🔢 Events count:', eventsCount);
    
    return { success: true, count, eventsData, eventsCount };
  } catch (error) {
    console.error('❌ Debug test exception:', error);
    return { success: false, error };
  }
} 

// Simplified test version of fetchEventsWithImages
export async function fetchEventsWithImagesSimple() {
  try {
    console.log('🔍 SIMPLE TEST: Starting fetchEventsWithImages simple test...');
    
    // Test 1: Basic query without any filters
    console.log('📊 Test 1: Basic query...');
    const { data: basicData, error: basicError } = await supabase
      .from('events')
      .select('*')
      .limit(5);
    
    if (basicError) {
      console.error('❌ Basic query failed:', basicError);
      return { success: false, error: basicError, step: 'basic_query' };
    }
    
    console.log('✅ Basic query successful:', basicData.length, 'events');
    
    // Test 2: Query with ordering
    console.log('📊 Test 2: Query with ordering...');
    const { data: orderedData, error: orderedError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(5);
    
    if (orderedError) {
      console.error('❌ Ordered query failed:', orderedError);
      return { success: false, error: orderedError, step: 'ordered_query' };
    }
    
    console.log('✅ Ordered query successful:', orderedData.length, 'events');
    
    // Test 3: Query with count
    console.log('📊 Test 3: Query with count...');
    const { data: countData, error: countError, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: false })
      .limit(5);
    
    if (countError) {
      console.error('❌ Count query failed:', countError);
      return { success: false, error: countError, step: 'count_query' };
    }
    
    console.log('✅ Count query successful:', countData.length, 'events, total:', count);
    
    // Test 4: Query with range (pagination)
    console.log('📊 Test 4: Query with range...');
    const { data: rangeData, error: rangeError, count: rangeCount } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: false })
      .range(0, 4); // First 5 items
    
    if (rangeError) {
      console.error('❌ Range query failed:', rangeError);
      return { success: false, error: rangeError, step: 'range_query' };
    }
    
    console.log('✅ Range query successful:', rangeData.length, 'events, total:', rangeCount);
    
    // Test 5: Test event_images table
    console.log('📊 Test 5: Event images table...');
    const { data: imagesData, error: imagesError } = await supabase
      .from('event_images')
      .select('*')
      .limit(5);
    
    if (imagesError) {
      console.error('❌ Images query failed:', imagesError);
      return { success: false, error: imagesError, step: 'images_query' };
    }
    
    console.log('✅ Images query successful:', imagesData.length, 'images');
    
    return { 
      success: true, 
      tests: {
        basic: basicData.length,
        ordered: orderedData.length,
        count: count,
        range: rangeCount,
        images: imagesData.length
      }
    };
  } catch (error) {
    console.error('❌ Simple test exception:', error);
    return { success: false, error };
  }
} 