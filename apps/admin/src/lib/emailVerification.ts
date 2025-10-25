import { randomBytes, createHash } from 'crypto';
import { addHours } from 'date-fns';

/**
 * Email Verification Utilities
 * Handles token generation, validation, and verification logic
 */

// Generate a secure random 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a secure random token for deep links
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash a verification code for database storage (security)
export function hashVerificationCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

// Verify a code against a stored hash
export function verifyCodeHash(code: string, hash: string): boolean {
  const codeHash = hashVerificationCode(code);
  return codeHash === hash;
}

// Get verification expiry time (24 hours from now)
export function getVerificationExpiry(): Date {
  return addHours(new Date(), 24);
}

// Check if verification has expired
export function isVerificationExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return new Date() > expiry;
}

// Generate verification email HTML template
export function generateVerificationEmailHtml(
  firstName: string, 
  verificationCode: string,
  deepLinkToken?: string
): string {
  const deepLink = deepLinkToken ? `docmchurch://verify?token=${deepLinkToken}` : null;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verify Your Email - DOCM Church</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: white; border: 2px solid #1f2937; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937; }
        .button { display: inline-block; background: #1f2937; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to DOCM Church!</h1>
        <p>Please verify your email address</p>
      </div>
      
      <div class="content">
        <p>Hi ${firstName},</p>
        
        <p>Thank you for joining the DOCM Church mobile app! To complete your registration, please verify your email address.</p>
        
        ${deepLink ? `
          <p><strong>Option 1: Open in App (Recommended)</strong></p>
          <p>
            <a href="${deepLink}" class="button">Open in DOCM Church App</a>
          </p>
          
          <p><strong>Option 2: Enter Verification Code</strong></p>
        ` : '<p><strong>Enter this verification code in the app:</strong></p>'}
        
        <div class="code-box">
          <div class="code">${verificationCode}</div>
          <p><small>This code expires in 24 hours</small></p>
        </div>
        
        <p>If you didn't create an account with DOCM Church, please ignore this email.</p>
        
        <p>Blessings,<br>
        The DOCM Church Team</p>
      </div>
      
      <div class="footer">
        <p>DOCM Church - Demonstration of Christ Ministries</p>
        <p>This email was sent from a no-reply address. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text version of verification email
export function generateVerificationEmailText(
  firstName: string,
  verificationCode: string,
  deepLinkToken?: string
): string {
  const deepLink = deepLinkToken ? `docmchurch://verify?token=${deepLinkToken}` : null;
  
  return `
Welcome to DOCM Church!

Hi ${firstName},

Thank you for joining the DOCM Church mobile app! To complete your registration, please verify your email address.

${deepLink ? `
Option 1: Open this link in your mobile device:
${deepLink}

Option 2: Enter this verification code in the app:
` : 'Enter this verification code in the app:'}

${verificationCode}

This code expires in 24 hours.

If you didn't create an account with DOCM Church, please ignore this email.

Blessings,
The DOCM Church Team

---
DOCM Church - Demonstration of Christ Ministries
This email was sent from a no-reply address. Please do not reply to this email.
  `.trim();
} 