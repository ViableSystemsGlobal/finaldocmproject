import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: segments, error } = await supabaseAdmin
      .from('newsletter_segments')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching segments:', error)
      return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 })
    }

    // Calculate subscriber counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => {
        let subscriberCount = 0
        
        try {
          if (segment.name === 'All Subscribers') {
            // Count all active subscribers
            const { count } = await supabaseAdmin
              .from('newsletter_subscribers')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active')
            subscriberCount = count || 0
          } else {
            // Count subscribers that have this segment in their segments array
            const segmentKey = segment.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
            const { count } = await supabaseAdmin
              .from('newsletter_subscribers')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active')
              .contains('segments', [segmentKey])
            subscriberCount = count || 0
          }
        } catch (countError) {
          console.error(`Error counting subscribers for segment ${segment.name}:`, countError)
          subscriberCount = 0
        }

        return {
          ...segment,
          subscriber_count: subscriberCount
        }
      })
    )

    return NextResponse.json({ segments: segmentsWithCounts })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 