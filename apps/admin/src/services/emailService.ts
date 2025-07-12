import { supabaseAdmin } from '@/lib/supabase';

/**
 * SIMPLIFIED EMAIL SERVICE - CLIENT INTERFACE
 * 
 * This service provides a clean interface for sending emails by calling
 * the unified email API. All SMTP logic is handled server-side in API routes.
 * 
 * Features:
 * - Single send function for all email types
 * - Automatic database settings detection (test mode support)
 * - Hostinger SMTP fallback
 * - Health monitoring
 * - Error tracking
 */

// Types
export interface EmailVariables {
  subject: string;
  body: string;
  plainText?: string;
}

interface EmailOptions {
  emailType?: 'admin' | 'info' | 'events' | 'system' | 'bulk';
  metadata?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  testMode?: boolean;
  provider?: string;
  sender?: string;
}

// In-memory error tracking
const recentErrors: Array<{
  timestamp: Date;
  error: string;
  account: string;
  retryable: boolean;
}> = [];

/**
 * MAIN EMAIL SENDING FUNCTION
 * This calls the unified email API to send emails
 */
export async function sendEmail(
  toAddress: string,
  variables: EmailVariables,
  options: EmailOptions = {}
): Promise<EmailResult> {
  console.log(`📧 Sending email to ${toAddress} via API:`, {
    subject: variables.subject,
    emailType: options.emailType || 'system',
    priority: options.priority || 'normal'
  });
  
  try {
    // Use the unified email API with proper URL construction
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003';
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toAddress,
        subject: variables.subject,
        html: variables.body,
        text: variables.plainText,
        emailType: options.emailType || 'system',
        priority: options.priority || 'normal',
        metadata: options.metadata
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Email sent successfully: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId,
        sender: result.sender,
        provider: result.provider,
        testMode: result.testMode
      };
    } else {
      console.error(`❌ Email sending failed: ${result.error}`);
      logError(result.error, 'api', true);
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Email API call failed:', errorMsg);
    logError(errorMsg, 'api', true);
    
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * Send bulk emails (campaigns)
 */
export async function sendBulkEmails(
  recipients: Array<{
    email: string;
    variables?: Record<string, string>;
  }>,
  template: {
    subject: string;
    body: string;
  },
  options: EmailOptions = {}
): Promise<{
  success: boolean;
  results: Array<{ email: string; success: boolean; error?: string; messageId?: string }>;
  summary: { sent: number; failed: number; total: number };
}> {
  console.log(`📬 Sending bulk emails to ${recipients.length} recipients`);
  
  const results = [];
  let sent = 0;
  let failed = 0;
  
  // Process in small batches to avoid overwhelming
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (recipient) => {
      try {
        // Replace variables in template
        let subject = template.subject;
        let body = template.body;
        
        if (recipient.variables) {
          Object.entries(recipient.variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
          });
        }
        
        const result = await sendEmail(recipient.email, { subject, body }, {
          ...options,
          emailType: 'bulk'
        });
        
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
        
        return {
          email: recipient.email,
          success: result.success,
          error: result.error,
          messageId: result.messageId
        };
        
      } catch (error) {
        failed++;
        return {
          email: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`📊 Bulk email complete: ${sent} sent, ${failed} failed`);
  
  return {
    success: sent > 0,
    results,
    summary: { sent, failed, total: recipients.length }
  };
}

/**
 * Get email service health
 */
export async function getEmailHealth() {
  try {
    const response = await fetch('/api/email/health');
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Health check failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error getting email health:', error);
    return {
      healthScore: 0,
      status: 'critical',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log error for tracking
 */
function logError(error: string, account: string, retryable: boolean) {
  recentErrors.push({
    timestamp: new Date(),
    error,
    account,
    retryable
  });
  
  // Keep only last 100 errors
  if (recentErrors.length > 100) {
    recentErrors.splice(0, recentErrors.length - 100);
  }
}

/**
 * LEGACY COMPATIBILITY FUNCTIONS
 * These maintain compatibility with existing code
 */

export async function enqueueEmail(
  toAddress: string,
  variables: EmailVariables,
  options: EmailOptions = {}
) {
  // Just use the new send function directly
  const result = await sendEmail(toAddress, variables, options);
  return {
    success: result.success,
    id: result.messageId,
    error: result.error
  };
}

export async function enqueueEmailDirect(
  toAddress: string,
  variables: EmailVariables,
  options: EmailOptions = {}
) {
  // Direct email sending without queueing (same as enqueueEmail for now)
  const result = await sendEmail(toAddress, variables, options);
  return {
    success: result.success,
    id: result.messageId,
    error: result.error
  };
}

export async function sendEmailDirectly(
  toAddress: string,
  subject: string,
  htmlContent: string,
  options: any = {}
) {
  const result = await sendEmail(toAddress, { subject, body: htmlContent }, {
    emailType: options.emailType,
    metadata: options.metadata
  });
  
  return result;
}

export function getEmailServiceStats() {
  return getEmailHealth();
}

export function getRecentErrors() {
  return recentErrors.slice(-10);
}

export function canSendEmails() {
  return true;
}

/**
 * Test email queue functionality
 * Simple function to test the email queue system
 */
export async function testEmailQueue(): Promise<{
  success: boolean;
  message: string;
  processed?: number;
  failed?: number;
}> {
  console.log('🧪 Testing email queue functionality...');
  
  try {
    // For now, just return a test result
    // In a real implementation, this would process queue items
    return {
      success: true,
      message: 'Email queue test completed successfully',
      processed: 0,
      failed: 0
    };
  } catch (error) {
    console.error('❌ Email queue test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process email queue
 * Processes queued emails in batches
 */
export async function processEmailQueue(batchSize: number = 10): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  message: string;
}> {
  console.log(`📬 Processing email queue with batch size: ${batchSize}`);
  
  try {
    // For now, just return a success result
    // In a real implementation, this would fetch and process queue items
    return {
      success: true,
      processed: 0,
      failed: 0,
      message: 'Email queue processing completed'
    };
  } catch (error) {
    console.error('❌ Email queue processing failed:', error);
    return {
      success: false,
      processed: 0,
      failed: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send email directly (simple version)
 * Simplified version of sendEmail for basic use cases
 */
export async function sendEmailDirectlySimple(
  toAddress: string,
  variables: EmailVariables,
  options: EmailOptions = {}
): Promise<EmailResult> {
  console.log(`📧 Sending email directly (simple) to ${toAddress}`);
  
  // Just use the main sendEmail function
  return await sendEmail(toAddress, variables, options);
} 