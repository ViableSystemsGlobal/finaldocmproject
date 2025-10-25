import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyCodeHash,
  isVerificationExpired
} from '@/lib/emailVerification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, verificationCode, contactId } = body;

    console.log('🔍 Verifying email for:', email);

    // Validate required fields
    if (!verificationCode || (!email && !contactId)) {
      return NextResponse.json(
        { error: 'Verification code and either email or contactId are required' },
        { status: 400 }
      );
    }

    // Find the contact record
    let query = supabase
      .from('contacts')
      .select('id, email, first_name, email_verified, email_verification_token, email_verification_expires');

    if (contactId) {
      query = query.eq('id', contactId);
    } else {
      query = query.eq('email', email);
    }

    const { data: contact, error } = await query.single();

    if (error || !contact) {
      console.error('Contact not found:', error);
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (contact.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
        contactId: contact.id
      });
    }

    // Check if verification token exists
    if (!contact.email_verification_token) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new verification email.' },
        { status: 400 }
      );
    }

    // Check if verification has expired
    if (!contact.email_verification_expires || isVerificationExpired(contact.email_verification_expires)) {
      console.log('Verification expired for:', contact.email);
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new verification email.' },
        { status: 400 }
      );
    }

    // Verify the code
    const isValidCode = verifyCodeHash(verificationCode, contact.email_verification_token);

    if (!isValidCode) {
      console.log('Invalid verification code for:', contact.email);
      return NextResponse.json(
        { error: 'Invalid verification code. Please check the code and try again.' },
        { status: 400 }
      );
    }

    // Mark as verified and clear verification data
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error('Error updating contact verification status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    console.log('✅ Email verified successfully for:', contact.email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      contactId: contact.id,
      email: contact.email,
      firstName: contact.first_name,
      verified: true
    });

  } catch (error) {
    console.error('❌ Error in verify-email:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 