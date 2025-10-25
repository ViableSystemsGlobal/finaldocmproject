import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      dateOfBirth, 
      location, 
      occupation,
      lifecycle
    } = body;

    console.log('📝 Contact submission received:', { firstName, lastName, email });

    // Validation
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Create Supabase client with anon key (for public access)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the actual tenant_id from tenant_settings
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenant_settings')
      .select('id')
      .single();

    if (tenantError) {
      console.error('❌ Error fetching tenant_id:', tenantError);
    }

    const TENANT_ID = tenantData?.id || null;
    console.log('🏢 Tenant ID:', TENANT_ID);

    // Check if email already exists in pending submissions
    const { data: existingSubmission } = await supabase
      .from('contact_submissions')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingSubmission) {
      return NextResponse.json(
        { 
          error: 'A submission with this email is already pending review. Please wait for approval or contact us directly.',
          code: 'DUPLICATE_SUBMISSION'
        },
        { status: 409 }
      );
    }

    // Check if email already exists in contacts
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .single();

    if (existingContact) {
      return NextResponse.json(
        { 
          error: 'This email is already registered in our system. If you need to update your information, please contact us directly.',
          code: 'ALREADY_EXISTS'
        },
        { status: 409 }
      );
    }

    // Insert into contact_submissions table
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          date_of_birth: dateOfBirth || null,
          location: location?.trim() || null,
          occupation: occupation?.trim() || null,
          lifecycle: lifecycle || 'visitor',
          status: 'pending',
          tenant_id: TENANT_ID,
          submitted_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting contact submission:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { 
          error: 'Failed to submit your details. Please try again.',
          debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    console.log('✅ Contact submission received:', {
      id: data.id,
      name: `${firstName} ${lastName}`,
      email: email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your details have been submitted successfully! Our team will review and approve your submission soon.',
        submissionId: data.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Unexpected error in submit-contact API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('   Error details:', errorMessage);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

