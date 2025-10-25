import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Email accounts configuration (same as admin)
const EMAIL_ACCOUNTS = [
  { email: 'admin@docmchurch.org', type: 'admin', password: 'h:PF?0~H', priority: 1 },
  { email: 'info@docmchurch.org', type: 'info', password: '4R*]IL4QyS$', priority: 1 },
  { email: 'events@docmchurch.org', type: 'events', password: '4R*]IL4QyS$', priority: 1 },
  { email: 'no-reply@docmchurch.org', type: 'system', password: '4R*]IL4QyS$', priority: 1 },
]

function getSenderAccount(emailType: string = 'system') {
  // Find account by type, or use default
  const account = EMAIL_ACCOUNTS.find(acc => acc.type === emailType) || EMAIL_ACCOUNTS[3]
  return account
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, emailType = 'system', priority = 'normal' } = body

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`📧 Sending email to ${to} with subject: ${subject}`)
    console.log(`   Email Type: ${emailType}`)
    console.log(`   Priority: ${priority}`)

    // Get sender account
    const senderAccount = getSenderAccount(emailType)
    
    // Check if we're in development mode without SMTP access
    const isDevelopment = process.env.NODE_ENV === 'development'
    const useTestMode = isDevelopment && process.env.EMAIL_TEST_MODE !== 'false'
    
    if (useTestMode) {
      // Simulate email sending in development
      console.log(`📧 [TEST MODE] Email simulated:`)
      console.log(`   From: ${senderAccount.email}`)
      console.log(`   To: ${to}`)
      console.log(`   Subject: ${subject}`)
      console.log(`   HTML Length: ${html.length} chars`)
      
      return NextResponse.json({
        success: true,
        messageId: 'test-' + Date.now(),
        sender: senderAccount.email,
        provider: 'Test Mode (Email Logged Only)',
        testMode: true
      })
    }

    // Real email sending (production)
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: senderAccount.email,
        pass: senderAccount.password
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"DOCM Church" <${senderAccount.email}>`,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''),
      replyTo: 'info@docmchurch.org'
    })

    console.log(`✅ Email sent successfully using ${senderAccount.email}`)
    console.log(`   Message ID: ${info.messageId}`)
    console.log(`   To: ${to}`)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      sender: senderAccount.email,
      provider: 'Hostinger SMTP'
    })

  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      },
      { status: 500 }
    )
  }
}

