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
    console.log('=== Media Debug API ===')
    
    // Test environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
    
    console.log('Environment check:', envCheck)
    
    // Test admin connection
    const { data: mediaData, error: mediaError } = await supabaseAdmin
      .from('media_library')
      .select('*')
      .limit(5)
    
    if (mediaError) {
      console.error('Media query error:', mediaError)
      return NextResponse.json({ 
        success: false, 
        error: mediaError,
        env: envCheck
      })
    }
    
    console.log('Media data retrieved:', mediaData?.length || 0, 'items')
    
    return NextResponse.json({ 
      success: true, 
      mediaCount: mediaData?.length || 0,
      media: mediaData,
      env: envCheck
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
} 