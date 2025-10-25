import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_categories')
      .select('*')
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching payment categories:', error)
      return NextResponse.json({ error: 'Failed to fetch payment categories' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in payment categories GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category_type, is_active, requires_reference, processing_fee_percentage, order } = body

    if (!name || !category_type) {
      return NextResponse.json({ error: 'Name and category type are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('payment_categories')
      .insert({
        name,
        description: description || null,
        category_type,
        is_active: is_active ?? true,
        requires_reference: requires_reference ?? false,
        processing_fee_percentage: processing_fee_percentage || null,
        order: order || 999
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payment category:', error)
      return NextResponse.json({ error: 'Failed to create payment category' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in payment categories POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 