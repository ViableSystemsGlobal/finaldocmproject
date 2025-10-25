// API endpoint for extracting YouTube video metadata
import { NextRequest, NextResponse } from 'next/server'
import { extractYouTubeInfo, isValidYouTubeUrl } from '@/services/youtube'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'YouTube URL is required' },
        { status: 400 }
      )
    }
    
    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL format' },
        { status: 400 }
      )
    }
    
    const result = await extractYouTubeInfo(url)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      method: result.method
    })
    
  } catch (error) {
    console.error('YouTube metadata extraction error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST method with YouTube URL in body' },
    { status: 405 }
  )
} 