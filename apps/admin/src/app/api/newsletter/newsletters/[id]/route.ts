import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: newsletter, error } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        newsletter_templates (
          id,
          name,
          category,
          description,
          html_content
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching newsletter:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch newsletter' 
      }, { status: 500 })
    }

    if (!newsletter) {
      return NextResponse.json({ 
        success: false, 
        error: 'Newsletter not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      newsletter 
    })

  } catch (error) {
    console.error('Error in GET newsletter:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { 
      subject, 
      preheader, 
      content, 
      template_id,
      sender_name,
      sender_email,
      reply_to,
      status,
      scheduled_date,
      target_audience,
      subscriber_segments,
      include_unsubscribe,
      track_opens,
      track_clicks
    } = body

    // Validate required fields
    if (!subject || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subject and content are required' 
      }, { status: 400 })
    }

    const updateData: any = {
      subject,
      preheader,
      content,
      template_id,
      sender_name,
      sender_email,
      reply_to,
      status: status || 'draft',
      target_audience,
      subscriber_segments: subscriber_segments || [],
      include_unsubscribe: include_unsubscribe ?? true,
      track_opens: track_opens ?? true,
      track_clicks: track_clicks ?? true,
      updated_at: new Date().toISOString()
    }

    // Add scheduled_date if provided
    if (scheduled_date) {
      updateData.scheduled_date = scheduled_date
    }

    // If status is being changed to 'sent', add sent_at timestamp
    if (status === 'sent' || status === 'sending') {
      updateData.sent_at = new Date().toISOString()
    }

    const { data: updatedNewsletter, error } = await supabaseAdmin
      .from('newsletters')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        newsletter_templates (
          id,
          name,
          category,
          description,
          html_content
        )
      `)
      .single()

    if (error) {
      console.error('Error updating newsletter:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update newsletter' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      newsletter: updatedNewsletter,
      message: 'Newsletter updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT newsletter:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin
      .from('newsletters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting newsletter:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete newsletter' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Newsletter deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE newsletter:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 