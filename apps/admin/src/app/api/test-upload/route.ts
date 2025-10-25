import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      success: true,
      message: 'Test endpoint working',
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        serviceKey1: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
        serviceKey2: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Test POST endpoint called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    return NextResponse.json({ 
      success: true,
      message: 'POST test working',
      fileReceived: !!file,
      fileName: file?.name || 'No file',
      fileSize: file?.size || 0,
    });
  } catch (error) {
    console.error('Test POST error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
} 