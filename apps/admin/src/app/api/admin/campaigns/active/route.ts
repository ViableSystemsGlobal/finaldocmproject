import { NextResponse } from 'next/server'
import { fetchActiveCampaigns } from '@/services/giving'

// GET /api/admin/campaigns/active
export async function GET() {
  try {
    const { data, error } = await fetchActiveCampaigns()
    
    if (error) {
      console.error('Error fetching active campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch active campaigns' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in campaigns API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 