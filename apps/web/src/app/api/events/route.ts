import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { autoGenerateRecurringEvents } from '@/lib/auto-recurring-events'

// Default/fallback events data
const defaultEvents = [
  {
    id: 'default-1',
    name: "Sunday Worship Experience",
    event_date: "2024-01-28T09:00:00",
    location: "Main Sanctuary",
    description: "Join us for an inspiring worship experience with contemporary music and biblical teaching.",
    capacity: 200,
    primary_image: null,
    gradient: "from-blue-800 to-indigo-900",
    type: "worship"
  },
  {
    id: 'default-2',
    name: "Midweek Connection",
    event_date: "2024-01-31T19:00:00",
    location: "Fellowship Hall",
    description: "Dive deeper into God's word through interactive Bible study and fellowship.",
    capacity: 50,
    primary_image: null,
    gradient: "from-purple-800 to-pink-900",
    type: "study"
  },
  {
    id: 'default-3',
    name: "Youth Ignite Night",
    event_date: "2024-02-02T19:00:00",
    location: "Youth Center",
    description: "High-energy youth service with games, worship, and relevant messages for teens.",
    capacity: 100,
    primary_image: null,
    gradient: "from-green-800 to-teal-900",
    type: "youth"
  },
  {
    id: 'default-4',
    name: "Community Outreach",
    event_date: "2024-02-05T10:00:00",
    location: "Community Center",
    description: "Join us as we serve our community with love and compassion through various outreach programs.",
    capacity: 150,
    primary_image: null,
    gradient: "from-orange-800 to-red-900",
    type: "outreach"
  }
]

// Helper functions
function getEventGradient(name: string, id: string): string {
  const gradients = [
    'from-blue-800 to-indigo-900',
    'from-purple-800 to-pink-900',
    'from-green-800 to-teal-900',
    'from-orange-800 to-red-900',
    'from-emerald-800 to-cyan-900',
    'from-violet-800 to-purple-900'
  ]
  // Use id hash to get consistent gradient
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

function getEventType(name: string, description?: string): string {
  const lowerName = name.toLowerCase()
  const lowerDesc = description?.toLowerCase() || ''
  
  if (lowerName.includes('worship') || lowerName.includes('service')) return 'worship'
  if (lowerName.includes('youth') || lowerName.includes('teen')) return 'youth'
  if (lowerName.includes('study') || lowerName.includes('bible')) return 'study'
  if (lowerName.includes('outreach') || lowerName.includes('community')) return 'outreach'
  if (lowerName.includes('prayer') || lowerName.includes('pray')) return 'prayer'
  if (lowerName.includes('fellowship') || lowerName.includes('connect')) return 'fellowship'
  
  return 'general'
}

export async function GET(request: NextRequest) {
  try {
    // Enhanced environment check with detailed logging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlPrefix: supabaseUrl?.substring(0, 20) + '...',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('🔄 EVENTS SOURCE: DEFAULT (Supabase not configured)')
      return NextResponse.json({ 
        events: defaultEvents,
        source: 'default',
        message: 'Using default events - Supabase not configured',
        debug: {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey,
          nodeEnv: process.env.NODE_ENV
        }
      })
    }

    let supabase
    try {
      supabase = createServerSupabaseClient()
      console.log('✅ Supabase client created successfully')
    } catch (error) {
      console.error('❌ Supabase client creation failed:', error)
      return NextResponse.json({ 
        events: defaultEvents,
        source: 'default',
        message: 'Using default events - Supabase client failed',
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          nodeEnv: process.env.NODE_ENV
        }
      })
    }

    console.log('🔍 Attempting to fetch events from database...')
    
    // NOTE: Auto-generation disabled to prevent duplicates
    // Use "Generate Next Occurrence" button in admin instead
    // await autoGenerateRecurringEvents()
    
    // Get upcoming events (event_date >= start of today)
    // Fix: Use start of day instead of exact current time
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    console.log('📅 Querying events from start of today:', startOfToday)
    
    // First, fetch events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', startOfToday)
      .order('event_date', { ascending: true })
      .limit(10) // Get max 10 upcoming events

    console.log('📊 Database query result:', {
      events: events,
      error: eventsError,
      eventsLength: events ? events.length : 0,
      errorCode: eventsError?.code,
      errorMessage: eventsError?.message,
      errorDetails: eventsError?.details
    })

    if (eventsError) {
      console.error('🔄 EVENTS SOURCE: DEFAULT (Database error):', eventsError)
      return NextResponse.json({ 
        events: defaultEvents,
        source: 'default',
        message: `Using default events - Database error: ${eventsError.message}`,
        debug: {
          errorCode: eventsError.code,
          errorMessage: eventsError.message,
          errorDetails: eventsError.details,
          nodeEnv: process.env.NODE_ENV
        }
      })
    }

    if (!events || events.length === 0) {
      console.log('🔄 EVENTS SOURCE: DEFAULT (No upcoming events found)')
      return NextResponse.json({ 
        events: defaultEvents,
        source: 'default',
        message: 'Using default events - No upcoming events found',
        debug: {
          queryDate: startOfToday,
          eventsFound: events?.length || 0,
          nodeEnv: process.env.NODE_ENV
        }
      })
    }

    // Fetch images for these events
    const eventIds = events.map(event => event.id)
    const { data: images, error: imageError } = await supabase
      .from('event_images')
      .select('*')
      .in('event_id', eventIds)
      .order('sort_order', { ascending: true })

    if (imageError) {
      console.warn('⚠️ Error fetching event images (continuing without images):', imageError)
    }

    // Create image map
    const imageMap = new Map()
    if (images && images.length > 0) {
      const imagesByEvent = images.reduce((acc: any, img) => {
        if (!acc[img.event_id]) {
          acc[img.event_id] = []
        }
        acc[img.event_id].push(img)
        return acc
      }, {})
      
      Object.keys(imagesByEvent).forEach(eventId => {
        imageMap.set(eventId, imagesByEvent[eventId][0]) // First image as primary
      })
    }

    // Transform events to frontend format
    const transformedEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      event_date: event.event_date,
      location: event.location || 'Location TBD',
      description: event.description || 'Join us for this special event.',
      capacity: event.capacity,
      primary_image: imageMap.get(event.id) || null,
      // Add some variety in gradients and types
      gradient: getEventGradient(event.name, event.id),
      type: getEventType(event.name, event.description)
    }))
    
    console.log('✅ EVENTS SOURCE: DATABASE (Successfully loaded from CMS)')
    console.log('📋 Transformed events:', transformedEvents.map(e => ({ id: e.id, name: e.name, date: e.event_date })))
    
    return NextResponse.json({ 
      events: transformedEvents,
      source: 'database',
      message: `Loaded ${transformedEvents.length} upcoming events from database`,
      debug: {
        rawEventsCount: events.length,
        transformedEventsCount: transformedEvents.length,
        imagesCount: images?.length || 0,
        queryDate: startOfToday,
        nodeEnv: process.env.NODE_ENV
      }
    })

  } catch (error) {
    console.error('🔄 EVENTS SOURCE: DEFAULT (Unexpected error):', error)
    return NextResponse.json({ 
      events: defaultEvents,
      source: 'default',
      message: 'Using default events - Unexpected error',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        nodeEnv: process.env.NODE_ENV
      }
    })
  }
} 