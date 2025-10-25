import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 API: Toggling user status with admin client:', params.id);
    const { disabled } = await request.json();
    
    // Update user app_metadata to store disabled status
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
      app_metadata: { disabled: disabled }
    });
    
    if (error) {
      console.warn('⚠️ API: Status toggle failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: {
          message: error.message || 'Failed to update user status',
          code: 'STATUS_UPDATE_ERROR',
          details: error
        }
      }, { status: 400 });
    }
    
    console.log('✅ API: User status toggled successfully');
    return NextResponse.json({ success: true, data: data.user });
    
  } catch (error) {
    console.error('💥 API: Error toggling user status:', error);
    return NextResponse.json({ 
      success: false, 
      error: {
        message: 'Server error updating user status',
        code: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 