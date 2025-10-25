import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔑 API: Resetting password for user with admin client:', params.id);
    
    // Get user email first
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(params.id);
    
    if (userError || !userData.user.email) {
      console.warn('⚠️ API: User not found for password reset:', userError);
      return NextResponse.json({ 
        success: false, 
        error: {
          message: 'User not found or email not available',
          code: 'USER_NOT_FOUND',
          details: userError
        }
      }, { status: 404 });
    }
    
    // Send password reset email
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(userData.user.email);
    
    if (error) {
      console.warn('⚠️ API: Password reset failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: {
          message: error.message || 'Failed to send password reset email',
          code: 'PASSWORD_RESET_ERROR',
          details: error
        }
      }, { status: 400 });
    }
    
    console.log('✅ API: Password reset email sent successfully');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('💥 API: Error resetting password:', error);
    return NextResponse.json({ 
      success: false, 
      error: {
        message: 'Server error resetting password',
        code: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 