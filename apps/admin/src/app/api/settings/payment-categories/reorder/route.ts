import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const { categories } = await request.json()

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: 'Categories must be an array' }, { status: 400 })
    }

    // Update each category's order
    const updatePromises = categories.map(({ id, order }) =>
      supabaseAdmin
        .from('payment_categories')
        .update({ order, updated_at: new Date().toISOString() })
        .eq('id', id)
    )

    const results = await Promise.all(updatePromises)
    
    // Check for errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Error reordering payment categories:', errors)
      return NextResponse.json({ error: 'Failed to reorder payment categories' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in payment categories reorder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 