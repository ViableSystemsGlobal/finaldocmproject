/**
 * Auto-generate next occurrence for recurring events (Admin version)
 * Same logic as website but uses admin supabase client
 */

import { supabaseAdmin } from './supabase'

interface RecurringEvent {
  id: string
  name: string
  description: string | null
  location: string | null
  location_data: any
  capacity: number | null
  event_date: string
  is_recurring: boolean
  recurrence_rule: string
  recurrence_end: string | null
  recurrence_count: number | null
  parent_event_id: string | null
  status: string
}

/**
 * Calculate next occurrence date based on recurrence rule
 */
function calculateNextDate(currentDate: string, rule: string): Date {
  const current = new Date(currentDate)
  const next = new Date(current)

  switch (rule) {
    case 'daily':
      next.setDate(current.getDate() + 1)
      break
    case 'weekly':
      next.setDate(current.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(current.getMonth() + 1)
      break
    case 'yearly':
      next.setFullYear(current.getFullYear() + 1)
      break
    default:
      next.setDate(current.getDate() + 7) // Default to weekly
  }

  return next
}

/**
 * Copy images from one event to another
 */
async function copyEventImages(sourceEventId: string, targetEventId: string) {
  try {
    // Get images from source event
    const { data: sourceImages, error: fetchError } = await supabaseAdmin
      .from('event_images')
      .select('*')
      .eq('event_id', sourceEventId)
      .order('sort_order', { ascending: true })

    if (fetchError) {
      // Silently fail if no images table or error - not critical
      return { success: true }
    }

    if (!sourceImages || sourceImages.length === 0) {
      // No images to copy - that's ok
      return { success: true }
    }

    // Prepare images for target event
    const newImages = sourceImages.map(img => ({
      event_id: targetEventId,
      url: img.url || (img as any).image_url, // Support both column names
      alt_text: img.alt_text,
      sort_order: img.sort_order
    }))

    // Insert images
    const { error: insertError } = await supabaseAdmin
      .from('event_images')
      .insert(newImages)

    if (insertError) {
      // Log but don't fail - images are nice to have but not critical
      console.log('Could not copy images (non-critical):', insertError.message)
      return { success: true }
    }

    console.log(`✅ Copied ${newImages.length} images to new event ${targetEventId}`)
    return { success: true }
    
  } catch (error) {
    // Don't fail the whole process if images fail
    console.log('Could not copy images (non-critical)')
    return { success: true }
  }
}

/**
 * Auto-generate next occurrence for a recurring event if needed
 */
async function generateNextOccurrence(event: RecurringEvent): Promise<boolean> {
  try {
    // Check if event date has passed
    const eventDate = new Date(event.event_date)
    const now = new Date()
    
    if (eventDate > now) {
      // Event hasn't happened yet, no need to generate
      return false
    }

    // Calculate next date
    const nextDate = calculateNextDate(event.event_date, event.recurrence_rule)

    // Check if we've reached the end date
    if (event.recurrence_end && nextDate > new Date(event.recurrence_end)) {
      return false
    }

    // Check if we've reached the count limit
    if (event.recurrence_count) {
      const parentId = event.parent_event_id || event.id
      const { count } = await supabaseAdmin
        .from('events')
        .select('*', { count: 'exact', head: true })
        .or(`id.eq.${parentId},parent_event_id.eq.${parentId}`)

      if (count && count >= event.recurrence_count) {
        return false
      }
    }

    // Check if next occurrence already exists
    const parentId = event.parent_event_id || event.id
    const nextDateStr = nextDate.toISOString()
    
    // Check both exact match and similar dates (within same day)
    const nextDateObj = new Date(nextDateStr)
    const startOfDay = new Date(nextDateObj)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(nextDateObj)
    endOfDay.setHours(23, 59, 59, 999)
    
    const { data: existingOccurrences } = await supabaseAdmin
      .from('events')
      .select('id, event_date')
      .eq('parent_event_id', parentId)
      .gte('event_date', startOfDay.toISOString())
      .lte('event_date', endOfDay.toISOString())

    if (existingOccurrences && existingOccurrences.length > 0) {
      console.log(`✓ Next occurrence already exists for ${event.name} on ${nextDateStr}`)
      return false
    }

    // Create next occurrence
    const newEvent = {
      name: event.name,
      description: event.description,
      location: event.location,
      location_data: event.location_data,
      capacity: event.capacity,
      event_date: nextDateStr,
      is_recurring: true,
      recurrence_rule: event.recurrence_rule,
      recurrence_end: event.recurrence_end,
      recurrence_count: event.recurrence_count,
      parent_event_id: parentId,
      status: 'scheduled'
    }

    const { data: createdEvent, error: createError } = await supabaseAdmin
      .from('events')
      .insert(newEvent)
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating next occurrence:', createError)
      return false
    }

    console.log(`✅ Created next occurrence of "${event.name}" for ${nextDateStr}`)

    // Copy images from original/parent event
    const sourceEventId = event.parent_event_id || event.id
    await copyEventImages(sourceEventId, createdEvent.id)

    return true
    
  } catch (error) {
    console.error('Error in generateNextOccurrence:', error)
    return false
  }
}

// Simple in-memory lock to prevent concurrent executions
let isGenerating = false
let lastGenerationTime = 0
const GENERATION_COOLDOWN = 5000 // 5 seconds cooldown

/**
 * Main function: Auto-generate next occurrences for all past recurring events
 */
export async function autoGenerateRecurringEvents(): Promise<void> {
  // Prevent concurrent executions
  if (isGenerating) {
    console.log('⏭️  Auto-generation already in progress, skipping...')
    return
  }
  
  // Cooldown to prevent rapid repeated calls
  const timeSinceLastGeneration = Date.now() - lastGenerationTime
  if (timeSinceLastGeneration < GENERATION_COOLDOWN) {
    return // Silent skip during cooldown
  }
  
  isGenerating = true
  lastGenerationTime = Date.now()
  
  try {
    const now = new Date()
    
    // Find all recurring events that have passed
    const { data: pastRecurringEvents, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_recurring', true)
      .lt('event_date', now.toISOString())
      .order('event_date', { ascending: true })
      .limit(50) // Limit to prevent processing too many at once

    if (error) {
      console.error('Error fetching recurring events:', error)
      return
    }

    if (!pastRecurringEvents || pastRecurringEvents.length === 0) {
      return
    }

    // Only process events that don't have a future occurrence
    const eventsToProcess = []
    for (const event of pastRecurringEvents) {
      const parentId = event.parent_event_id || event.id
      
      // Check if there's ANY future occurrence for this recurring series
      const { data: futureOccurrence } = await supabaseAdmin
        .from('events')
        .select('id')
        .or(`id.eq.${parentId},parent_event_id.eq.${parentId}`)
        .gt('event_date', now.toISOString())
        .limit(1)
        .single()
      
      if (!futureOccurrence) {
        eventsToProcess.push(event)
      }
    }

    if (eventsToProcess.length === 0) {
      // All recurring events already have future occurrences - silent return
      return
    }

    console.log(`🔄 Generating next occurrences for ${eventsToProcess.length} events...`)

    let generatedCount = 0
    
    for (const event of eventsToProcess) {
      const generated = await generateNextOccurrence(event as RecurringEvent)
      if (generated) generatedCount++
    }

    if (generatedCount > 0) {
      console.log(`✅ Auto-generated ${generatedCount} next occurrences`)
    }
    
  } catch (error) {
    console.error('Error in autoGenerateRecurringEvents:', error)
  } finally {
    isGenerating = false
  }
}

