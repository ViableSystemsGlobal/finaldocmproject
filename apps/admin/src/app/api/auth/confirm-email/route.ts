import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    console.log('🔧 Admin confirming email for:', email);

    // Validate required fields
    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Either email or userId is required' },
        { status: 400 }
      );
    }

    // Find the user in Supabase auth
    let user;
    if (userId) {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data.user) {
        console.error('User not found by ID:', error);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      user = data.user;
    } else {
      // Find user by email
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('Error listing users:', error);
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        );
      }
      
      user = data.users.find(u => u.email === email);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Check if already confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: 'Email already confirmed',
        alreadyConfirmed: true,
        user: {
          id: user.id,
          email: user.email,
          emailConfirmedAt: user.email_confirmed_at
        }
      });
    }

    // Confirm the user's email using admin API
    const { data: updatedUser, error: confirmError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true
      }
    );

    if (confirmError) {
      console.error('Error confirming email:', confirmError);
      return NextResponse.json(
        { error: 'Failed to confirm email: ' + confirmError.message },
        { status: 500 }
      );
    }

    console.log('✅ Email confirmed successfully for:', email);

    return NextResponse.json({
      success: true,
      message: 'Email confirmed successfully',
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        emailConfirmedAt: updatedUser.user.email_confirmed_at
      }
    });

  } catch (error) {
    console.error('❌ Error in confirm-email:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 