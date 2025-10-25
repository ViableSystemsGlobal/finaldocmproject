import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Environment check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔍 DEBUG: Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlPrefix: supabaseUrl?.substring(0, 20) + '...',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Supabase not configured',
        debug: {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey,
          nodeEnv: process.env.NODE_ENV
        }
      })
    }

    // Create Supabase client
    let supabase
    try {
      supabase = createServerSupabaseClient()
      console.log('✅ DEBUG: Supabase client created successfully')
    } catch (error) {
      console.error('❌ DEBUG: Supabase client creation failed:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Supabase client creation failed',
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          nodeEnv: process.env.NODE_ENV
        }
      })
    }

    // Test database connection and query events table
    const today = new Date().toISOString()
    console.log('📅 DEBUG: Querying events after:', today)
    
    // Query all events (not just upcoming ones)
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(5)

    console.log('📊 DEBUG: All events query result:', {
      allEvents,
      allEventsError,
      allEventsLength: allEvents ? allEvents.length : 0
    })

    // Query upcoming events
    const { data: upcomingEvents, error: upcomingEventsError } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(5)

    console.log('📊 DEBUG: Upcoming events query result:', {
      upcomingEvents,
      upcomingEventsError,
      upcomingEventsLength: upcomingEvents ? upcomingEvents.length : 0
    })

    // Query events table info
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .limit(0)

    console.log('📊 DEBUG: Table info query result:', {
      tableInfo,
      tableInfoError,
      totalCount: tableInfo ? tableInfo.length : 0
    })

    return NextResponse.json({ 
      success: true,
      debug: {
        environment: {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey,
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        },
        queries: {
          allEvents: {
            success: !allEventsError,
            count: allEvents?.length || 0,
            error: allEventsError,
            data: allEvents?.map(e => ({ id: e.id, name: e.name, date: e.event_date })) || []
          },
          upcomingEvents: {
            success: !upcomingEventsError,
            count: upcomingEvents?.length || 0,
            error: upcomingEventsError,
            data: upcomingEvents?.map(e => ({ id: e.id, name: e.name, date: e.event_date })) || []
          },
          tableInfo: {
            success: !tableInfoError,
            error: tableInfoError
          }
        }
      }
    })

  } catch (error) {
    console.error('❌ DEBUG: Unexpected error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Unexpected error',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        nodeEnv: process.env.NODE_ENV
      }
    })
  }
} 