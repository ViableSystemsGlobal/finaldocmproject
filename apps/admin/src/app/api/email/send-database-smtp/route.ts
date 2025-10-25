import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { loadCommunicationSettings } from '@/services/comms/settings';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { to, subject, html, text, emailType = 'system' } = body;
    
    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and html are required' },
        { status: 400 }
      );
    }
    
    // Load email settings from database
    const { data: settings, error: settingsError } = await loadCommunicationSettings();
    
    if (settingsError || !settings) {
      return NextResponse.json(
        { success: false, error: 'Failed to load email settings from database' },
        { status: 500 }
      );
    }
    
    const emailSettings = settings.email;
    
    console.log('Using database email settings:', {
      provider: emailSettings.provider,
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure,
      from: emailSettings.from_email,
      test_mode: emailSettings.test_mode
    });
    
    // If in test mode, just simulate success
    if (emailSettings.test_mode) {
      console.log('📧 Email simulated (test mode):', {
        to,
        subject,
        from: emailSettings.from_email,
        provider: emailSettings.provider
      });
      
      return NextResponse.json({
        success: true,
        messageId: 'test-' + Date.now(),
        sender: emailSettings.from_email,
        provider: 'Test Mode (Simulated)',
        test_mode: true
      });
    }
    
    // Create transporter using database settings
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure,
      auth: {
        user: emailSettings.smtp_username || emailSettings.from_email,
        pass: emailSettings.smtp_password || ''
      }
    });
    
    // Verify connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'SMTP connection failed: ' + (verifyError instanceof Error ? verifyError.message : 'Unknown error')
        },
        { status: 500 }
      );
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${emailSettings.from_name}" <${emailSettings.from_email}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    });
    
    console.log('Email sent successfully:', info.messageId);
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      sender: emailSettings.from_email,
      provider: emailSettings.provider
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending email'
      },
      { status: 500 }
    );
  }
} 