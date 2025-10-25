import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/email/test-system
 * Test the email system by sending a test email
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing email system via API...');
    
    const body = await request.json();
    const { to, subject, html } = body;
    
    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: to, subject, and html are required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`📧 Sending test email to: ${to}`);
    
    // Use our unified email API to send the test email
    const emailResponse = await fetch(`${request.nextUrl.origin}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject: `[TEST] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #28a745; margin: 0;">✅ Email System Test</h2>
              <p style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px;">
                This is a test email from your DOCM Church Management System
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
              ${html}
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 8px; font-size: 12px; color: #6c757d;">
              <p style="margin: 0;"><strong>Test Details:</strong></p>
              <p style="margin: 5px 0 0 0;">
                • Sent at: ${new Date().toLocaleString()}<br/>
                • System: DOCM Church Management<br/>
                • Test Type: Email System Verification
              </p>
            </div>
          </div>
        `,
        emailType: 'system'
      })
    });
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ Test email failed:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Email sending failed: ${errorText}` 
        },
        { status: 500 }
      );
    }
    
    const emailResult = await emailResponse.json();
    
    if (emailResult.success) {
      console.log('✅ Test email sent successfully:', emailResult.messageId);
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: emailResult.messageId,
        sender: emailResult.sender,
        provider: emailResult.provider,
        testMode: emailResult.testMode
      });
    } else {
      console.error('❌ Test email failed:', emailResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: emailResult.error || 'Email sending failed' 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('💥 Unexpected error testing email system:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 