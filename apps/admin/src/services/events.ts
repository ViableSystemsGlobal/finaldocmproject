import { supabase } from '@/lib/supabase';

export type Event = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  event_date: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_end: string | null;
  recurrence_count: number | null;
  created_at: string;
  updated_at: string;
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
    const response = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
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

// Fetch events with their primary image
export async function fetchEventsWithImages() {
  try {
    console.log('fetchEventsWithImages: Attempting to fetch events with images');
    
    // First, fetch all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (eventsError) {
      console.error('fetchEventsWithImages error:', eventsError);
      throw eventsError;
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
    
    console.log(`fetchEventsWithImages: Successfully fetched ${eventsWithImages.length} events with ${imageMap.size} images`);
    return { data: eventsWithImages, error: null };
  } catch (error) {
    console.error('fetchEventsWithImages exception:', error);
    throw error;
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
    
    return response;
  } catch (error) {
    console.error(`updateEvent exception for ID ${id}:`, error);
    throw error;
  }
}

export async function deleteEvent(id: string) {
  try {
    console.log(`deleteEvent: Deleting event ${id}`);
    const response = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (response.error) {
      console.error('deleteEvent error:', response.error);
      throw response.error;
    }
    
    return response;
  } catch (error) {
    console.error(`deleteEvent exception for ID ${id}:`, error);
    throw error;
  }
}

// Event images operations
export async function fetchEventImages(event_id: string) {
  try {
    console.log(`fetchEventImages: Attempting to fetch images for event ${event_id}`);
    const response = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', event_id)
      .order('sort_order', { ascending: true });
    
    if (response.error) {
      console.error('fetchEventImages error:', response.error);
      return response;
    }
    
    console.log(`fetchEventImages: Fetched ${response.data?.length || 0} images:`, response.data);
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