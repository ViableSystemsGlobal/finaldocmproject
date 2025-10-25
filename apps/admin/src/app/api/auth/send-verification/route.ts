import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateVerificationCode,
  generateVerificationToken,
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
    const { email, firstName, contactId, includeDeepLink = false } = body;

    console.log('📧 Sending verification email to:', email);

    // Validate required fields
    if (!email || !firstName) {
      return NextResponse.json(
        { error: 'Email and firstName are required' },
        { status: 400 }
      );
    }

    // Generate verification code and token
    const verificationCode = generateVerificationCode();
    const verificationToken = generateVerificationToken();
    const hashedCode = hashVerificationCode(verificationCode);
    const expiresAt = getVerificationExpiry();

    console.log('🔑 Generated verification code for', email, '- Code:', verificationCode);

    // Find the contact record
    let contact;
    if (contactId) {
      // Update existing contact by ID
      const { data, error } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('Error finding contact by ID:', error);
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        );
      }
      contact = data;
    } else {
      // Find existing contact by email or create new one
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .single();

      if (existingContact) {
        contact = existingContact;
      } else {
        // Create new contact
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            email,
            first_name: firstName,
            email_verified: false,
            tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Default tenant ID
          })
          .select('id, email, first_name, last_name')
          .single();

        if (error) {
          console.error('Error creating contact:', error);
          
          // Handle specific constraint violations with user-friendly messages
          if (error.code === '23505' && error.message.includes('contacts_email_key')) {
            return NextResponse.json(
              { error: 'This email address is already registered. Please use a different email.' },
              { status: 400 }
            );
          }
          
          return NextResponse.json(
            { error: 'Failed to create contact record' },
            { status: 500 }
          );
        }
        contact = newContact;
      }
    }

    // Update contact with verification data
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        email_verification_token: hashedCode, // Store hashed code for security
        email_verification_expires: expiresAt.toISOString(),
        email_verification_sent_at: new Date().toISOString(),
        email_verified: false
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
    const deepLinkToken = includeDeepLink ? verificationToken : undefined;
    const htmlContent = generateVerificationEmailHtml(firstName, verificationCode, deepLinkToken);
    const textContent = generateVerificationEmailText(firstName, verificationCode, deepLinkToken);

    // Send email using existing email service
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3003'}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Verify Your Email - DOCM Church',
        html: htmlContent,
        text: textContent,
        emailType: 'system' // Use system email account
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

    console.log('✅ Verification email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      contactId: contact.id,
      emailSent: true,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ Error in send-verification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 