import { NextResponse } from 'next/server';
import { getSenderAccount, getSMTPConfig, USE_GMAIL_FALLBACK } from '@/lib/emailAccounts';

// Import nodemailer dynamically to avoid server/client issues
const nodemailer = require('nodemailer');

// Email attachment type
interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { to, subject, html, text, emailType = 'system', attachments } = body;
    
    // Get the appropriate sender account based on email type
    const senderAccount = getSenderAccount(emailType);
    const smtpConfig = getSMTPConfig();
    
    console.log(`📧 Sending direct email to ${to} using ${senderAccount.email}`);
    console.log('📮 Email provider settings:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure, 
      user: senderAccount.email,
      usingGmailFallback: USE_GMAIL_FALLBACK
    });
    
    // Validate required fields
    if (!to || !subject || !html) {
      console.error('❌ Missing required fields in email request');
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html are required' },
        { status: 400 }
      );
    }
    
    // Configure transporter using the appropriate SMTP settings
    const transporterConfig = USE_GMAIL_FALLBACK 
      ? {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: smtpConfig.auth,
          debug: false,
          logger: false
        }
      : {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: {
            user: senderAccount.email,
            pass: senderAccount.password,
          },
          debug: false,
          logger: false
        };
    
    const transporter = nodemailer.createTransport(transporterConfig);
    
    // Verify connection
    try {
      await transporter.verify();
      console.log(`✅ SMTP connection verified successfully for ${senderAccount.email}`);
    } catch (verifyError) {
      console.error(`❌ SMTP connection verification failed for ${senderAccount.email}:`, verifyError);
      return NextResponse.json(
        { 
          success: false, 
          error: verifyError instanceof Error ? verifyError.message : 'SMTP connection failed',
          account: senderAccount.email
        },
        { status: 500 }
      );
    }
    
    // Process attachments if any
    const processedAttachments = attachments 
      ? attachments.map((attachment: EmailAttachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
          encoding: attachment.encoding || 'base64'
        }))
      : undefined;
    
    // Send email
    const info = await transporter.sendMail({
      from: `"DOCM Church" <${senderAccount.email}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Plain text version
      html, // HTML version
      attachments: processedAttachments
    });
    
    console.log('✅ Email sent successfully:', info.messageId);
    
    return NextResponse.json({ 
      success: true,
      messageId: info.messageId,
      sender: senderAccount.email,
      provider: 'hostinger'
    });
  } catch (error) {
    console.error('💥 Error sending direct email:', error);
    
    // Provide more detailed error information
    const errorDetail = error instanceof Error 
      ? {
          message: error.message,
          name: error.name,
        }
      : { message: 'Unknown error type' };
      
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending email',
        errorDetail
      },
      { status: 500 }
    );
  }
} 