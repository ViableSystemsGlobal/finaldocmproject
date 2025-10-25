import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Sending test email through Hostinger...');
    
    // Call our own email send API
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'test@example.com', // Change this to your email for testing
        subject: 'Test Email from DOCM Church System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">DOCM Church Email Test</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              This is a test email from the DOCM Church Management System.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              If you're receiving this email, it means the Hostinger email configuration is working correctly.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>This is an automated test email from the DOCM Church Management System.</p>
              <p>Sent at: ${new Date().toISOString()}</p>
            </div>
          </div>
        `
      }),
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailResult: result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending test email'
    }, { status: 500 });
  }
} 