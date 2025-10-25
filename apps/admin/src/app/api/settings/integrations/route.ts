import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching integration settings...')
    
    const { data: integrations, error } = await supabaseAdmin
      .from('integration_settings')
      .select('*')
      .order('provider')

    if (error) {
      console.error('❌ Error fetching integrations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${integrations?.length || 0} integrations`)
    return NextResponse.json(integrations || [])

  } catch (error) {
    console.error('💥 Error in integrations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, config, is_active = true } = body

    if (!provider || !config) {
      return NextResponse.json(
        { error: 'Provider and config are required' },
        { status: 400 }
      )
    }

    console.log(`🔧 Upserting integration: ${provider}`)

    const { data, error } = await supabaseAdmin
      .from('integration_settings')
      .upsert([{ provider, config, is_active }], { onConflict: 'provider' })
      .select()
      .single()

    if (error) {
      console.error('❌ Error upserting integration:', error)
      return NextResponse.json(
        { error: 'Failed to save integration' },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully saved integration: ${provider}`)
    return NextResponse.json(data)

  } catch (error) {
    console.error('💥 Error in integrations POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 