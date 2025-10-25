import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Fetch upcoming events only (today and future)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, event_date, location, description')
      .gte('event_date', today.toISOString()) // Events from today onwards
      .order('event_date', { ascending: true }) // Show soonest first
      .limit(20) // Limit to next 20 upcoming events
    
    if (error) {
      console.error('Error fetching events:', error)
      throw error
    }
    
    return NextResponse.json({ 
      success: true,
      events: events || []
    })
  } catch (error) {
    console.error('Error in events-list API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch events',
        events: []
      },
      { status: 500 }
    )
  }
}

