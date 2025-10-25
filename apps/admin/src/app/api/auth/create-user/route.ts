import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, contactId } = body;

    console.log('🔧 Creating user via admin API for:', email);

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user using admin API (bypasses email signup restrictions)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        contact_id: contactId
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user: ' + createError.message },
        { status: 500 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'No user returned from creation' },
        { status: 500 }
      );
    }

    console.log('✅ User created successfully:', userData.user.id);

    // Create mobile app user record if contactId provided
    if (contactId) {
      console.log('📱 Creating mobile app user record for contact:', contactId);
      
      try {
        const { data: mobileUserData, error: mobileUserError } = await supabase
          .from('mobile_app_users')
          .insert({
            contact_id: contactId,
            auth_user_id: userData.user.id,
            status: 'active',
            devices: [],
            registered_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          })
          .select();

        if (mobileUserError) {
          console.warn('⚠️ Failed to create mobile app user record:', mobileUserError);
          // Don't fail the request, just log the warning
        } else {
          console.log('✅ Mobile app user record created:', mobileUserData?.[0]?.id);
        }
      } catch (mobileError) {
        console.warn('⚠️ Error creating mobile app user record:', mobileError);
        // Don't fail the request, just log the warning
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        emailConfirmed: true
      }
    });

  } catch (error) {
    console.error('❌ Error in create-user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 