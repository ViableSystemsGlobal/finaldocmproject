import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify request authentication (optional - add API key check)
    const authHeader = req.headers.get('Authorization')
    const apiKey = Deno.env.get('AUTO_COMPLETE_API_KEY')
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🕒 Starting auto-completion check...')

    // Find overdue events (more than 1 hour past their scheduled time)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: overdueEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'scheduled')
      .lt('event_date', oneHourAgo)

    if (fetchError) {
      console.error('Error fetching overdue events:', fetchError)
      throw fetchError
    }

    if (!overdueEvents || overdueEvents.length === 0) {
      console.log('✅ No overdue events found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No overdue events found',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`📋 Found ${overdueEvents.length} overdue events to process`)

    const results = []
    let processedCount = 0

    for (const event of overdueEvents) {
      try {
        console.log(`🔄 Processing event: ${event.name} (${event.id})`)

        // Mark event as completed
        const { error: updateError } = await supabase
          .from('events')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id)

        if (updateError) throw updateError

        let nextEventCreated = false
        let nextEventId = null

        // Create next occurrence if recurring
        if (event.is_recurring) {
          const nextEvent = await createNextOccurrence(supabase, event)
          if (nextEvent) {
            nextEventCreated = true
            nextEventId = nextEvent.id
            console.log(`✨ Created next occurrence: ${nextEvent.id}`)
          }
        }

        results.push({
          eventId: event.id,
          name: event.name,
          originalDate: event.event_date,
          status: 'completed',
          nextCreated: nextEventCreated,
          nextEventId
        })

        processedCount++
        console.log(`✅ Completed event: ${event.name}`)

      } catch (error) {
        console.error(`❌ Failed to process event ${event.id}:`, error)
        results.push({
          eventId: event.id,
          name: event.name,
          status: 'failed',
          error: error.message
        })
      }
    }

    // Log the activity
    await supabase
      .from('event_logs')
      .insert({
        action: 'auto_complete_overdue',
        details: {
          processed_count: processedCount,
          total_found: overdueEvents.length,
          results,
          timestamp: new Date().toISOString()
        }
      })

    console.log(`🎉 Auto-completion finished. Processed ${processedCount}/${overdueEvents.length} events`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} overdue events`,
        processed: processedCount,
        total: overdueEvents.length,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in auto-complete function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to create next occurrence
async function createNextOccurrence(supabase: any, event: any) {
  try {
    // Calculate next occurrence date
    const currentDate = new Date(event.event_date)
    let nextDate: Date

    switch (event.recurrence_rule) {
      case 'daily':
        nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        nextDate = new Date(currentDate)
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'yearly':
        nextDate = new Date(currentDate)
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
      default:
        nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) // Default weekly
    }

    // Check end conditions
    if (event.recurrence_end && nextDate > new Date(event.recurrence_end)) {
      console.log(`⏹️ Recurrence end date reached for ${event.name}`)
      return null
    }

    // Check occurrence count
    if (event.recurrence_count) {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('parent_event_id', event.id)

      if (count && count >= event.recurrence_count) {
        console.log(`⏹️ Maximum occurrences reached for ${event.name}`)
        return null
      }
    }

    // Create next occurrence
    const { data: newEvent, error } = await supabase
      .from('events')
      .insert({
        name: event.name,
        description: event.description,
        location: event.location,
        location_data: event.location_data,
        capacity: event.capacity,
        event_date: nextDate.toISOString(),
        is_recurring: true,
        recurrence_rule: event.recurrence_rule,
        recurrence_end: event.recurrence_end,
        recurrence_count: event.recurrence_count,
        parent_event_id: event.id,
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) throw error

    // Copy images from the original event to the new occurrence
    try {
      const { data: sourceImages, error: fetchError } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', event.id)
        .order('sort_order')

      if (fetchError) {
        console.warn('Error fetching source images for copying:', fetchError)
      } else if (sourceImages && sourceImages.length > 0) {
        // Prepare image data for insertion
        const imageData = sourceImages.map((image: any) => ({
          event_id: newEvent.id,
          url: image.url,
          alt_text: image.alt_text,
          sort_order: image.sort_order
        }))

        // Insert the copied images
        const { error: insertError } = await supabase
          .from('event_images')
          .insert(imageData)

        if (insertError) {
          console.warn('Error copying images to new event occurrence:', insertError)
        } else {
          console.log(`✨ Copied ${sourceImages.length} images to new event occurrence`)
        }
      }
    } catch (imageError) {
      console.warn('Error in image copying process:', imageError)
      // Don't fail the entire operation if image copying fails
    }

    return newEvent

  } catch (error) {
    console.error('Error creating next occurrence:', error)
    return null
  }
} 