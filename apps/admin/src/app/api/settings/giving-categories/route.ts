import { NextResponse } from 'next/server'
import { fetchGivingCategories } from '@/services/settings'

// GET /api/settings/giving-categories
export async function GET() {
  try {
    const { success, data, error } = await fetchGivingCategories()
    
    if (error) {
      console.error('Error fetching giving categories:', error)
      return NextResponse.json({ error: 'Failed to fetch giving categories' }, { status: 500 })
    }

    return NextResponse.json({ success, data })
  } catch (error) {
    console.error('Error in giving categories API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 