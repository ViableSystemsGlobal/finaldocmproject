import { NextResponse } from 'next/server';

// SendGrid email interface
interface SendGridEmail {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

// Environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_ADDRESS = process.env.NEXT_PUBLIC_FROM_ADDRESS || 'noreply@church.org';

/**
 * Send email via SendGrid API
 * 
 * This is a simple wrapper around the SendGrid API to send a single email.
 * In a production environment, you would use the @sendgrid/mail package.
 */
export async function POST(request: Request) {
  // Check if SendGrid API key is configured
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not configured');
    return NextResponse.json(
      { error: 'SendGrid API key is not configured' },
      { status: 500 }
    );
  }

  try {
    // Parse request body
    const body = await request.json() as SendGridEmail;
    
    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, or html' },
        { status: 400 }
      );
    }
    
    // Ensure from address is set
    const fromAddress = body.from || FROM_ADDRESS;
    
    // Create SendGrid API request payload
    const sendgridPayload = {
      personalizations: [
        {
          to: [{ email: body.to }],
        },
      ],
      from: { email: fromAddress },
      subject: body.subject,
      content: [
        {
          type: 'text/html',
          value: body.html,
        },
      ],
    };

    if (body.text) {
      sendgridPayload.content.push({
        type: 'text/plain',
        value: body.text,
      });
    }
    
    // Send request to SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendgridPayload),
    });
    
    // Handle SendGrid API response
    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid API error:', error);
      return NextResponse.json(
        { error: `SendGrid API error: ${error}` },
        { status: response.status }
      );
    }
    
    // Log success
    console.log(`Email sent to ${body.to}`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 