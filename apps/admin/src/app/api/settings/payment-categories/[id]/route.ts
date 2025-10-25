import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, category_type, is_active, requires_reference, processing_fee_percentage, order } = body

    if (!name || !category_type) {
      return NextResponse.json({ error: 'Name and category type are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('payment_categories')
      .update({
        name,
        description: description || null,
        category_type,
        is_active: is_active ?? true,
        requires_reference: requires_reference ?? false,
        processing_fee_percentage: processing_fee_percentage || null,
        order: order || 999,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment category:', error)
      return NextResponse.json({ error: 'Failed to update payment category' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in payment category PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('payment_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment category:', error)
      return NextResponse.json({ error: 'Failed to delete payment category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in payment category DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 