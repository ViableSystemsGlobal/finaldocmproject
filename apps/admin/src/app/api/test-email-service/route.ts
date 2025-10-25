import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/services/emailService'

/**
 * Test endpoint for the email service
 * This endpoint allows testing the email service independently
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json()
    
    if (!to || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'to, subject, and body are required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing email service - To: ${to}, Subject: ${subject}`)

    const result = await sendEmail(to, {
      subject,
      body,
      plainText: body.replace(/<[^>]*>/g, '')
    }, {
      emailType: 'system',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    })

    console.log(`📊 Email service test result:`, result)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully`,
      to,
      subject,
      result: {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        provider: result.provider,
        sender: result.sender
      }
    })

  } catch (error) {
    console.error('❌ Error testing email service:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check email service status
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Email service is available',
      usage: {
        POST: '/api/test-email-service',
        body: {
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'This is a test email'
        }
      }
    })
  } catch (error) {
    console.error('❌ Error checking email service:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 