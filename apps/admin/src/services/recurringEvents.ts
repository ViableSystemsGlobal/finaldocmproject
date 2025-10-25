import { supabase } from '@/lib/supabase';
import type { Event } from './events';

/**
 * Calculate the next occurrence date based on recurrence rule
 */
export function calculateNextOccurrence(lastDate: string, recurrenceRule: string): Date {
  const lastOccurrence = new Date(lastDate);
  const nextDate = new Date(lastOccurrence);

  switch (recurrenceRule) {
    case 'daily':
      nextDate.setDate(lastOccurrence.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(lastOccurrence.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(lastOccurrence.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(lastOccurrence.getFullYear() + 1);
      break;
    default:
      nextDate.setDate(lastOccurrence.getDate() + 7); // Default to weekly
  }

  return nextDate;
}

/**
 * Copy images from one event to another
 */
async function copyEventImages(sourceEventId: string, targetEventId: string): Promise<{ success: boolean; error: any }> {
  try {
    // Get all images from the source event
    const { data: sourceImages, error: fetchError } = await supabase
      .from('event_images')
      .select('url, alt_text, sort_order')
      .eq('event_id', sourceEventId);

    if (fetchError) throw fetchError;

    if (!sourceImages || sourceImages.length === 0) {
      return { success: true, error: null }; // No images to copy
    }

    // Prepare new image records for the target event
    const newImageRecords = sourceImages.map(image => ({
      event_id: targetEventId,
      url: image.url,
      alt_text: image.alt_text,
      sort_order: image.sort_order
    }));

    // Insert the new image records
    const { error: insertError } = await supabase
      .from('event_images')
      .insert(newImageRecords);

    if (insertError) throw insertError;

    return { success: true, error: null };

  } catch (error) {
    console.error('Error copying event images:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error copying images')
    };
  }
}

/**
 * Create the next occurrence of a recurring event
 */
export async function createNextEventOccurrence(eventId: string): Promise<{ data: any; error: any }> {
  try {
    // Get the original event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;
    if (!event) throw new Error('Event not found');

    // Check if this event is recurring
    if (!event.is_recurring) {
      throw new Error('Event is not recurring');
    }

    // Calculate next occurrence date
    const nextDate = calculateNextOccurrence(event.event_date, event.recurrence_rule);

    // Check if we should stop creating occurrences
    if (event.recurrence_end && nextDate > new Date(event.recurrence_end)) {
      throw new Error('Recurrence end date reached');
    }

    // Count existing occurrences if there's a limit
    if (event.recurrence_count) {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('parent_event_id', eventId);

      if (count && count >= event.recurrence_count) {
        throw new Error('Maximum occurrences reached');
      }
    }

    // Create the next occurrence
    const nextEventData = {
      name: event.name,
      description: event.description,
      location: event.location,
      location_data: event.location_data,
      capacity: event.capacity,
      event_date: nextDate.toISOString(),
      is_recurring: true, // Keep it recurring so this occurrence can create the next one
      recurrence_rule: event.recurrence_rule, // Preserve recurrence pattern
      recurrence_end: event.recurrence_end, // Preserve end date
      recurrence_count: event.recurrence_count, // Preserve count limit
      parent_event_id: eventId, // Link to the parent recurring event
      status: 'scheduled'
    };

    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert(nextEventData)
      .select()
      .single();

    if (createError) throw createError;

    // Copy images from the original event to the new occurrence
    const { success: copySuccess, error: copyError } = await copyEventImages(eventId, newEvent.id);
    
    if (!copySuccess) {
      console.warn('Failed to copy images for new event occurrence:', copyError);
      // Don't fail the entire operation if image copying fails
    }

    return { data: newEvent, error: null };

  } catch (error) {
    console.error('Error creating next event occurrence:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error creating next occurrence')
    };
  }
}

/**
 * Mark an event as completed and create next occurrence if recurring
 */
export async function completeEventAndCreateNext(eventId: string): Promise<{ data: any; error: any }> {
  try {
    // Mark current event as completed
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId);

    if (updateError) throw updateError;

    // Get event details to check if it's recurring
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('is_recurring, parent_event_id')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    let nextEvent = null;

    // If this is a recurring event, create the next occurrence
    if (event.is_recurring) {
      const { data, error } = await createNextEventOccurrence(eventId);
      if (error) {
        console.warn('Could not create next occurrence:', error.message);
      } else {
        nextEvent = data;
      }
    }
    // If this is an occurrence of a recurring event, create next from parent
    else if (event.parent_event_id) {
      const { data, error } = await createNextEventOccurrence(event.parent_event_id);
      if (error) {
        console.warn('Could not create next occurrence:', error.message);
      } else {
        nextEvent = data;
      }
    }

    return { 
      data: { 
        message: nextEvent 
          ? 'Event completed and next occurrence created' 
          : 'Event completed' 
      }, 
      error: null 
    };

  } catch (error) {
    console.error('Error completing event:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error completing event')
    };
  }
}

/**
 * Generate multiple future occurrences of a recurring event
 */
/**
 * Calculate the next future occurrence from today
 */
export function calculateNextFutureOccurrence(lastDate: string, recurrenceRule: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  let currentDate = new Date(lastDate);
  
  // Keep calculating next occurrences until we find one in the future
  while (currentDate < today) {
    currentDate = calculateNextOccurrence(currentDate.toISOString(), recurrenceRule);
  }
  
  return currentDate;
}

export async function generateFutureOccurrences(eventId: string, count: number = 1, fromToday: boolean = true): Promise<{ data: any; error: any }> {
  try {
    // Get the original event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;
    if (!event) throw new Error('Event not found');

    if (!event.is_recurring) {
      throw new Error('Event is not recurring');
    }

    const futureEvents = [];
    
    // Start from next future occurrence (skips past dates) or from event date
    let currentDate = fromToday 
      ? calculateNextFutureOccurrence(event.event_date, event.recurrence_rule)
      : calculateNextOccurrence(event.event_date, event.recurrence_rule);

    console.log(`📅 Generating ${count} occurrence(s) starting from:`, currentDate.toISOString());

    for (let i = 0; i < count; i++) {
      // For subsequent iterations, calculate next from current
      if (i > 0) {
        currentDate = calculateNextOccurrence(currentDate.toISOString(), event.recurrence_rule);
      }

      // Check end conditions
      if (event.recurrence_end && currentDate > new Date(event.recurrence_end)) {
        console.log('⚠️ Recurrence end date reached');
        break;
      }
      if (event.recurrence_count && i + 1 > event.recurrence_count) {
        console.log('⚠️ Maximum occurrence count reached');
        break;
      }

      // Check if this occurrence already exists
      const parentId = event.parent_event_id || eventId;
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('parent_event_id', parentId)
        .eq('event_date', currentDate.toISOString())
        .single();

      if (existing) {
        console.log(`⚠️ Occurrence already exists for ${currentDate.toISOString()}`);
        continue; // Skip this one
      }

      futureEvents.push({
        name: event.name, // Use same name (no numbering)
        description: event.description,
        location: event.location,
        location_data: event.location_data,
        capacity: event.capacity,
        event_date: currentDate.toISOString(),
        is_recurring: true, // Keep each occurrence recurring
        recurrence_rule: event.recurrence_rule, // Preserve recurrence pattern
        recurrence_end: event.recurrence_end, // Preserve end date
        recurrence_count: event.recurrence_count, // Preserve count limit
        parent_event_id: event.parent_event_id || eventId, // Use parent if this is already a child
        status: 'scheduled'
      });
    }

    if (futureEvents.length === 0) {
      return { 
        data: [], 
        error: new Error('No new occurrences to create (may already exist or limits reached)') 
      };
    }

    // Insert all future occurrences
    const { data: insertedEvents, error: insertError } = await supabase
      .from('events')
      .insert(futureEvents)
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Created ${insertedEvents?.length || 0} future occurrence(s)`);

    // Copy images from original event to all new occurrences
    const sourceEventId = event.parent_event_id || eventId;
    for (const newEvent of insertedEvents || []) {
      try {
        await copyEventImages(sourceEventId, newEvent.id);
      } catch (error) {
        console.warn(`Failed to copy images for event ${newEvent.id}:`, error);
        // Continue with the next event
      }
    }

    return { data: insertedEvents, error: null };

  } catch (error) {
    console.error('Error generating future occurrences:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error generating occurrences')
    };
  }
}

/**
 * Get all occurrences of a recurring event
 */
export async function getEventOccurrences(parentEventId: string): Promise<{ data: Event[] | null; error: any }> {
  try {
    const { data: occurrences, error } = await supabase
      .from('events')
      .select('*')
      .eq('parent_event_id', parentEventId)
      .order('event_date', { ascending: true });

    if (error) throw error;

    return { data: occurrences, error: null };

  } catch (error) {
    console.error('Error fetching event occurrences:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error fetching occurrences')
    };
  }
}

/**
 * Cancel a recurring event series
 */
export async function cancelRecurringSeries(eventId: string): Promise<{ data: any; error: any }> {
  try {
    // Cancel the parent event
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'cancelled', is_recurring: false })
      .eq('id', eventId);

    if (updateError) throw updateError;

    // Cancel all future occurrences
    const { error: occurrenceError } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('parent_event_id', eventId)
      .eq('status', 'scheduled');

    if (occurrenceError) throw occurrenceError;

    return { data: { cancelled: true }, error: null };

  } catch (error) {
    console.error('Error cancelling recurring series:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error cancelling series')
    };
  }
}

/**
 * Automatically complete events that are overdue (past their event_date)
 * and create next occurrences for recurring events
 */
export async function autoCompleteOverdueEvents(): Promise<{ data: any; error: any }> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find all events that are scheduled but past their date
    const { data: overdueEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'scheduled')
      .lt('event_date', today.toISOString());

    if (fetchError) throw fetchError;

    if (!overdueEvents || overdueEvents.length === 0) {
      return { data: { message: 'No overdue events found' }, error: null };
    }

    console.log(`Found ${overdueEvents.length} overdue events to auto-complete`);

    const results = [];

    for (const event of overdueEvents) {
      try {
        // Complete the event and create next occurrence if recurring
        const { data, error } = await completeEventAndCreateNext(event.id);
        
        if (error) {
          console.warn(`Failed to auto-complete event ${event.id}:`, error.message);
          results.push({ 
            eventId: event.id, 
            name: event.name, 
            status: 'failed', 
            error: error.message 
          });
        } else {
          console.log(`Auto-completed event: ${event.name} (${event.id})`);
          results.push({ 
            eventId: event.id, 
            name: event.name, 
            status: 'completed', 
            nextCreated: event.is_recurring 
          });
        }
      } catch (err) {
        console.error(`Error processing event ${event.id}:`, err);
        results.push({ 
          eventId: event.id, 
          name: event.name, 
          status: 'failed', 
          error: 'Processing error' 
        });
      }
    }

    return { 
      data: { 
        message: `Processed ${overdueEvents.length} overdue events`, 
        results 
      }, 
      error: null 
    };

  } catch (error) {
    console.error('Error in autoCompleteOverdueEvents:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in auto-completion')
    };
  }
}

/**
 * Check and auto-complete overdue events (to be called periodically)
 */
export async function checkAndAutoComplete(): Promise<void> {
  try {
    const { data, error } = await autoCompleteOverdueEvents();
    
    if (error) {
      console.error('Auto-completion failed:', error);
    } else if (data?.results?.length > 0) {
      console.log('Auto-completion results:', data);
    }
  } catch (error) {
    console.error('Error in checkAndAutoComplete:', error);
  }
}
