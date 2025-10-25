import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        newsletter_templates(name, category)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('subject', `%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: newsletters, error, count } = await query

    if (error) {
      console.error('Error fetching newsletters:', error)
      return NextResponse.json({ error: 'Failed to fetch newsletters' }, { status: 500 })
    }

    return NextResponse.json({
      newsletters,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      subject,
      preheader,
      content,
      template_id,
      sender_name = 'DOCM Church',
      sender_email = 'newsletter@docmchurch.org',
      reply_to = 'admin@docmchurch.org',
      status = 'draft',
      target_audience = 'all',
      subscriber_segments = [],
      scheduled_date,
      track_opens = true,
      track_clicks = true,
      include_unsubscribe = true
    } = body

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Calculate recipient count based on target audience
    let totalRecipients = 0
    if (target_audience === 'all') {
      const { count } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      totalRecipients = count || 0
    } else if (target_audience === 'segment' && subscriber_segments.length > 0) {
      const { count } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .overlaps('segments', subscriber_segments)
      totalRecipients = count || 0
    }

    const { data: newsletter, error } = await supabaseAdmin
      .from('newsletters')
      .insert({
        subject,
        preheader,
        content,
        template_id,
        sender_name,
        sender_email,
        reply_to,
        status,
        target_audience,
        subscriber_segments,
        scheduled_date,
        total_recipients: totalRecipients,
        track_opens,
        track_clicks,
        include_unsubscribe,
        created_by: null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating newsletter:', error)
      return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 })
    }

    return NextResponse.json({ newsletter }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 