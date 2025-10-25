import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    console.log('=== Media Fetch API ===')
    
    // Fetch media items using admin client (bypasses RLS)
    const { data: mediaData, error: mediaError } = await supabaseAdmin
      .from('media_library')
      .select('*')
      .order('uploaded_at', { ascending: false })
    
    if (mediaError) {
      console.error('Media fetch error:', mediaError)
      return NextResponse.json({ 
        success: false, 
        data: null,
        error: mediaError
      })
    }
    
    console.log('✅ Media fetch successful:', mediaData?.length || 0, 'items')
    
    return NextResponse.json({ 
      success: true, 
      data: mediaData,
      error: null
    })
    
  } catch (error) {
    console.error('Media fetch API error:', error)
    return NextResponse.json({ 
      success: false, 
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
} 