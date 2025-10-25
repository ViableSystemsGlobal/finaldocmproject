/**
 * Direct Email Sending API (Bypasses Queue)
 * This route completely bypasses the email queue table
 * and instead directly sends the email via SMTP.
 * 
 * This is a temporary solution for schema cache issues
 * with the email_queue table in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSenderAccount, updateAccountHealth, canAccountSend } from '@/lib/emailAccounts';
import { loadCommunicationSettings } from '@/services/comms/settings';

interface BypassQueueRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  emailType?: 'admin' | 'info' | 'events' | 'system' | 'bulk';
  metadata?: Record<string, any>;
}

export async function POST(req: NextRequest) {
  let fromAddress: string | undefined;
  
  try {
    // Parse request body
    const requestData: BypassQueueRequest = await req.json();
    
    // Extract and validate required fields
    const { to, subject, html, text, emailType = 'system', metadata = {} } = requestData;
    
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Sending email directly (bypassing queue):', { to, subject, emailType });
    
    // Check if we should use test mode like campaigns do
    let shouldSimulate = false;
    
    try {
      // Load database email settings to check test mode
      const { data: settings, error: settingsError } = await loadCommunicationSettings();
      
      if (settings && settings.email && settings.email.test_mode) {
        // Simulate email sending in test mode (like campaigns do)
        fromAddress = settings.email.from_email;
        shouldSimulate = true;
        console.log('📧 Bypass-queue email simulated (test mode):', {
          to,
          subject,
          from: fromAddress,
          provider: settings.email.provider
        });
        
        return NextResponse.json({
          success: true,
          messageId: 'bypass-test-' + Date.now(),
          sender: fromAddress,
          provider: 'Test Mode (Simulated)',
          test_mode: true
        });
      }
    } catch (dbError) {
      console.log('Could not load database settings, proceeding with SMTP');
    }
    
    // If not in test mode, try actual SMTP (but this will likely fail with current credentials)
    const senderAccount = getSenderAccount(emailType);
    fromAddress = senderAccount.email;
    
    // Check if account can send
    if (!canAccountSend(senderAccount.email)) {
      console.warn(`⚠️ Account ${senderAccount.email} cannot send (rate limited or unhealthy)`);
      updateAccountHealth(senderAccount.email, false, 'Rate limited or unhealthy');
      
      return NextResponse.json({
        success: false,
        error: 'Email account is currently unavailable (rate limited or unhealthy)',
        canRetryLater: true
      }, { status: 429 });
    }
    
    // Create transporter (SMTP connection)
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: senderAccount.email,
        pass: senderAccount.password
      }
    });
    
    // Send mail
    const info = await transporter.sendMail({
      from: `"DOCM Church" <${fromAddress}>`,
      to: to,
      subject: subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Plain text fallback
      html: html,
      headers: {
        'X-Campaign-ID': metadata.campaign_id || '',
        'X-Recipient-ID': metadata.recipient_id || '',
        'X-Email-Type': emailType
      }
    });
    
    console.log('📧✅ Email sent successfully:', info.messageId);
    updateAccountHealth(senderAccount.email, true);
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      sender: fromAddress,
      provider: 'Hostinger SMTP'
    });
  } catch (error) {
    console.error('📧❌ Error sending email directly:', error);
    
    // Update account health on failure
    if (fromAddress) {
      updateAccountHealth(fromAddress, false, error instanceof Error ? error.message : 'Unknown error');
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 