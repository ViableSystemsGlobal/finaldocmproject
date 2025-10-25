import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: subscriber, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching subscriber:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch subscriber' 
      }, { status: 500 })
    }

    if (!subscriber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscriber not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      subscriber 
    })

  } catch (error) {
    console.error('Error in GET subscriber:', error)
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
    const { email, first_name, last_name, status, segments } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Check if email already exists for another subscriber
    const { data: existingSubscriber } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .neq('id', id)
      .single()

    if (existingSubscriber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email already exists for another subscriber' 
      }, { status: 400 })
    }

    const { data: updatedSubscriber, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update({
        email: email.toLowerCase(),
        first_name,
        last_name,
        status: status || 'active',
        segments: segments || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscriber:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update subscriber' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      subscriber: updatedSubscriber,
      message: 'Subscriber updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT subscriber:', error)
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
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting subscriber:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete subscriber' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscriber deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE subscriber:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 