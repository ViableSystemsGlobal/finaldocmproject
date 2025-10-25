import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSenderAccount, updateAccountHealth, canAccountSend } from '@/lib/emailAccounts';
import { loadCommunicationSettings } from '@/services/comms/settings';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * UNIFIED EMAIL API
 * 
 * This single endpoint handles all email sending:
 * - Prioritizes multi-account Hostinger system for high capacity
 * - Falls back to database settings if needed
 * - Supports test mode
 * - Built-in error handling and retry logic
 * - Compatible with existing code
 */

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  emailType?: 'admin' | 'info' | 'events' | 'system' | 'bulk';
  metadata?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

export async function POST(req: NextRequest) {
  try {
    const body: EmailRequest = await req.json();
    
    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and html are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`📧 Email API called for ${body.to} with subject: ${body.subject}`);
    
    // Step 1: Try multi-account Hostinger system first (original working system)
    try {
      const hostingerResult = await sendViaHostinger(body);
      if (hostingerResult.success) {
        console.log(`✅ Email sent via Hostinger multi-account system`);
        return NextResponse.json(hostingerResult, { headers: corsHeaders });
      }
      console.log('⚠️ Hostinger multi-account system failed, trying database settings...');
    } catch (hostingerError) {
      console.log('⚠️ Hostinger accounts unavailable, trying database settings...');
    }
    
    // Step 2: Fall back to database settings
    try {
      const dbResult = await sendViaDatabase(body);
      if (dbResult.success || dbResult.testMode) {
        console.log(`✅ Email sent via database settings (fallback)`);
        return NextResponse.json(dbResult, { headers: corsHeaders });
      }
      console.log('⚠️ Database settings also failed');
    } catch (dbError) {
      console.log('⚠️ Database settings unavailable');
    }
    
    // If both fail, return error
    return NextResponse.json({
      success: false,
      error: 'All email sending methods failed. Please check email configuration.'
    }, { status: 500, headers: corsHeaders });
    
  } catch (error) {
    console.error('💥 Email API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Send email using Hostinger multi-account system (primary method)
 * This provides high capacity with 13 accounts and smart load balancing
 */
async function sendViaHostinger(body: EmailRequest) {
  const originalEmailType = body.emailType || 'system';
  
  // Try multiple accounts within the Hostinger system before giving up
  const maxAttempts = 3;
  let lastError = '';
  let currentEmailType = originalEmailType;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Get sender account (this will automatically fallback to bulk accounts if primary fails)
      const senderAccount = getSenderAccount(currentEmailType);
      
      // Check account health
      if (!canAccountSend(senderAccount.email)) {
        console.log(`⚠️ Attempt ${attempt}: Account ${senderAccount.email} cannot send (rate limited or unhealthy), trying next account...`);
        continue;
      }
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
          user: senderAccount.email,
          pass: senderAccount.password
        }
      });
      
      // Verify connection
      await transporter.verify();
      
      const info = await transporter.sendMail({
        from: `"DOCM Church" <${senderAccount.email}>`,
        to: body.to,
        subject: body.subject,
        text: body.text || body.html.replace(/<[^>]*>/g, ''),
        html: body.html
      });
      
      // Update account health on success
      updateAccountHealth(senderAccount.email, true);
      
      console.log(`✅ Hostinger multi-account success on attempt ${attempt} using ${senderAccount.email}`);
      
      return {
        success: true,
        messageId: info.messageId,
        sender: senderAccount.email,
        provider: 'Hostinger Multi-Account System'
      };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'SMTP error';
      lastError = errorMsg;
      
      console.log(`❌ Hostinger attempt ${attempt} failed: ${errorMsg}`);
      
      // If this was a specific account attempt, mark it as failed and try bulk accounts
      if (attempt < maxAttempts) {
        console.log(`🔄 Trying alternative account (attempt ${attempt + 1})...`);
        
        // Force bulk account selection for next attempt
        if (attempt === 1 && currentEmailType !== 'bulk') {
          currentEmailType = 'bulk';
        }
      }
    }
  }
  
  console.log(`❌ All Hostinger accounts failed after ${maxAttempts} attempts. Last error: ${lastError}`);
  return {
    success: false,
    error: `Hostinger multi-account system failed: ${lastError}`
  };
}

/**
 * Send email using database settings (fallback method)
 */
async function sendViaDatabase(body: EmailRequest) {
  const { data: settings, error } = await loadCommunicationSettings();
  
  if (error || !settings?.email) {
    throw new Error('Database settings unavailable');
  }
  
  const emailSettings = settings.email;
  
  // Handle test mode
  if (emailSettings.test_mode) {
    console.log('📧 Email simulated (test mode):', {
      to: body.to,
      subject: body.subject,
      from: emailSettings.from_email,
      provider: emailSettings.provider
    });
    
    return {
      success: true,
      messageId: 'test-' + Date.now(),
      sender: emailSettings.from_email,
      provider: 'Test Mode (Simulated)',
      testMode: true
    };
  }
  
  // Check if database SMTP credentials are available
  if (!emailSettings.smtp_username || !emailSettings.smtp_password) {
    throw new Error('Database SMTP credentials not configured');
  }
  
  // Use database SMTP settings
  const transporter = nodemailer.createTransport({
    host: emailSettings.smtp_host,
    port: emailSettings.smtp_port,
    secure: emailSettings.smtp_secure,
    auth: {
      user: emailSettings.smtp_username,
      pass: emailSettings.smtp_password
    }
  });
  
  const info = await transporter.sendMail({
    from: `"DOCM Church" <${emailSettings.from_email}>`,
    to: body.to,
    subject: body.subject,
    text: body.text || body.html.replace(/<[^>]*>/g, ''),
    html: body.html
  });
  
  return {
    success: true,
    messageId: info.messageId,
    sender: emailSettings.from_email,
    provider: 'Database SMTP (Fallback)'
  };
} 