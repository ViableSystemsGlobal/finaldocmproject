import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email = 'test@example.com', firstName = 'Test User' } = body;

    console.log('🧪 Testing email verification system');

    // Test 1: Send verification email
    console.log('📧 Step 1: Sending verification email...');
    const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3003'}/api/auth/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        includeDeepLink: false
      })
    });

    const sendResult = await sendResponse.json();
    
    if (!sendResponse.ok) {
      console.error('❌ Failed to send verification email:', sendResult);
      return NextResponse.json({
        success: false,
        error: 'Failed to send verification email',
        details: sendResult
      }, { status: 500 });
    }

    console.log('✅ Verification email sent successfully');
    console.log('📧 Send result:', sendResult);

    return NextResponse.json({
      success: true,
      message: 'Email verification system test completed successfully',
      steps: {
        sendVerification: {
          success: true,
          contactId: sendResult.contactId,
          emailSent: sendResult.emailSent,
          expiresAt: sendResult.expiresAt
        }
      },
      nextSteps: [
        'Check your email for the verification code',
        `Use POST /api/auth/verify-email with { "email": "${email}", "verificationCode": "YOUR_CODE" }`,
        `Or test resend with POST /api/auth/resend-verification with { "email": "${email}" }`
      ]
    });

  } catch (error) {
    console.error('❌ Error in test-verification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email Verification Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        email: 'your-email@example.com (optional, defaults to test@example.com)',
        firstName: 'Your Name (optional, defaults to Test User)'
      }
    },
    endpoints: {
      sendVerification: '/api/auth/send-verification',
      verifyEmail: '/api/auth/verify-email',
      resendVerification: '/api/auth/resend-verification'
    }
  });
} 