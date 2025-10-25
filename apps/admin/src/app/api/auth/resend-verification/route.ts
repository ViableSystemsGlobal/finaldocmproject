import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateVerificationCode,
  hashVerificationCode,
  getVerificationExpiry,
  generateVerificationEmailHtml,
  generateVerificationEmailText
} from '@/lib/emailVerification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, contactId } = body;

    console.log('🔄 Resending verification email to:', email);

    // Validate required fields
    if (!email && !contactId) {
      return NextResponse.json(
        { error: 'Either email or contactId is required' },
        { status: 400 }
      );
    }

    // Find the contact record
    let query = supabase
      .from('contacts')
      .select('id, email, first_name, email_verified, email_verification_sent_at');

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
        message: 'Email is already verified',
        alreadyVerified: true,
        contactId: contact.id
      });
    }

    // Rate limiting: Check if we recently sent a verification email (within 1 minute)
    if (contact.email_verification_sent_at) {
      const lastSent = new Date(contact.email_verification_sent_at);
      const now = new Date();
      const timeDiff = now.getTime() - lastSent.getTime();
      const minutesSinceLastSent = timeDiff / (1000 * 60);

      if (minutesSinceLastSent < 1) {
        return NextResponse.json(
          { 
            error: 'Please wait at least 1 minute before requesting another verification email',
            waitTime: Math.ceil(60 - (timeDiff / 1000))
          },
          { status: 429 }
        );
      }
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const hashedCode = hashVerificationCode(verificationCode);
    const expiresAt = getVerificationExpiry();

    console.log('🔑 Generated new verification code for', contact.email, '- Code:', verificationCode);

    // Update contact with new verification data
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        email_verification_token: hashedCode,
        email_verification_expires: expiresAt.toISOString(),
        email_verification_sent_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error('Error updating contact verification data:', updateError);
      return NextResponse.json(
        { error: 'Failed to save verification data' },
        { status: 500 }
      );
    }

    // Generate email content
    const htmlContent = generateVerificationEmailHtml(contact.first_name || 'User', verificationCode);
    const textContent = generateVerificationEmailText(contact.first_name || 'User', verificationCode);

    // Send email using existing email service
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3003'}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: contact.email,
        subject: 'Verify Your Email - DOCM Church',
        html: htmlContent,
        text: textContent,
        emailType: 'system'
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Error sending verification email:', emailResult);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    console.log('✅ Verification email resent successfully to:', contact.email);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      contactId: contact.id,
      emailSent: true,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ Error in resend-verification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 