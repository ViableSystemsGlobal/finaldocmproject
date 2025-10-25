// Edge function that processes the email queue
// Schedule this to run every few minutes (e.g., every 5 minutes)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0";

// Configure environment
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") || "465");
const SMTP_SECURE = SMTP_PORT === 465;
const EMAIL_PASSWORD = Deno.env.get("EMAIL_PASSWORD") || "4R*]IL4QyS$";
const BATCH_SIZE = Number(Deno.env.get("EMAIL_BATCH_SIZE") || "20");
const MAX_ATTEMPTS = Number(Deno.env.get("EMAIL_MAX_ATTEMPTS") || "3");
const FROM_NAME = Deno.env.get("FROM_NAME") || "DOCM Church";

// Email accounts - keep in sync with the web app
const EMAIL_ACCOUNTS = [
  { email: 'admin@docmchurch.org', type: 'admin', password: EMAIL_PASSWORD },
  { email: 'info@docmchurch.org', type: 'info', password: EMAIL_PASSWORD },
  { email: 'events@docmchurch.org', type: 'events', password: EMAIL_PASSWORD },
  { email: 'no-reply@docmchurch.org', type: 'system', password: EMAIL_PASSWORD },
  { email: 'no-reply1@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply2@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply3@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply4@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply5@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply6@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply7@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply8@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
  { email: 'no-reply9@docmchurch.org', type: 'bulk', password: EMAIL_PASSWORD },
];

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Process the email queue
async function processQueue() {
  const now = new Date();
  console.log(`Starting queue processing at ${now.toISOString()}`);
  
  try {
    // Get emails ready to be sent
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('next_attempt_at', now.toISOString())
      .lt('attempts', MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error('Error fetching emails from queue:', error);
      return { success: false, error: error.message };
    }
    
    if (!emails || emails.length === 0) {
      console.log('No emails to process');
      return { success: true, processed: 0, message: 'No emails to process' };
    }
    
    console.log(`Processing ${emails.length} emails from queue`);
    
    // Process each email
    const results = await Promise.all(emails.map(async (email) => {
      try {
        // Mark as sending
        await supabase
          .from('email_queue')
          .update({
            status: 'sending',
            attempts: email.attempts + 1,
            last_attempt_at: now.toISOString()
          })
          .eq('id', email.id);
        
        // Find the account to use
        const emailType = email.metadata?.email_type || 'system';
        let senderAccount = EMAIL_ACCOUNTS.find(a => a.type === emailType);
        
        // Fallback to system account if the specified type isn't found
        if (!senderAccount) {
          senderAccount = EMAIL_ACCOUNTS.find(a => a.type === 'system')!;
        }
        
        // Handle bulk emails (round-robin)
        if (emailType === 'bulk') {
          const bulkAccounts = EMAIL_ACCOUNTS.filter(a => a.type === 'bulk');
          // Choose based on the email's attempt number to maintain consistency
          const index = email.attempts % bulkAccounts.length;
          senderAccount = bulkAccounts[index];
        }
        
        // Create SMTP client
        const client = new SmtpClient();
        
        // Connect to SMTP server
        await client.connectTLS({
          hostname: SMTP_HOST,
          port: SMTP_PORT,
          username: senderAccount.email,
          password: senderAccount.password,
        });
        
        // Parse attachments if any
        const attachments = email.attachments ? JSON.parse(email.attachments) : [];
        
        // Add tracking pixel for open tracking if requested
        let htmlBody = email.html_body;
        if (email.metadata?.track_opens) {
          const trackingPixel = `<img src="${SUPABASE_URL}/functions/v1/track_email?id=${email.id}&event=open" width="1" height="1" alt="" />`;
          htmlBody = htmlBody + trackingPixel;
        }
        
        // Add click tracking if requested
        if (email.metadata?.track_clicks) {
          // This would require HTML parsing which is beyond this example
          // In a real implementation, you'd scan for links and replace them with tracking URLs
        }
        
        // Send the email
        await client.send({
          from: `"${FROM_NAME}" <${senderAccount.email}>`,
          to: email.to_address,
          subject: email.subject,
          content: htmlBody,
          html: htmlBody,
        });
        
        // Close the connection
        await client.close();
        
        // Mark as sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);
        
        console.log(`Email ${email.id} sent successfully to ${email.to_address}`);
        return { id: email.id, success: true };
      } catch (error) {
        console.error(`Error sending email ${email.id}:`, error);
        
        // Calculate next retry time with exponential backoff
        // Simple backoff: 15min, 1hr, 4hr
        const delays = [15, 60, 240]; // minutes
        const nextAttemptDelay = delays[Math.min(email.attempts, delays.length - 1)];
        const nextAttemptAt = new Date(now.getTime() + nextAttemptDelay * 60 * 1000);
        
        // Mark as failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error),
            next_attempt_at: nextAttemptAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);
        
        return { id: email.id, success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    console.log(`Processed ${results.length} emails - Success: ${successful}, Failed: ${failed}`);
    
    return {
      success: true,
      processed: results.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    console.error('Error processing email queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Handle the HTTP request
serve(async (req) => {
  // Check for authorization (recommended in production)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unauthorized. Missing or invalid authorization header.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Extract the token
  const token = authHeader.replace("Bearer ", "");
  
  // Verify the token (in production, use a proper verification method)
  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unauthorized. Invalid token.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Process the queue
  const result = await processQueue();
  
  // Return the result
  return new Response(
    JSON.stringify(result),
    { 
      headers: { "Content-Type": "application/json" },
      status: result.success ? 200 : 500 
    }
  );
}); 