// Edge function for processing email batches via SMTP
// This runs on a schedule to send queued emails

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0";

// Configure environment
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const FROM_ADDRESS = Deno.env.get("FROM_ADDRESS") || "noreply@church.org";
const BATCH_SIZE = Number(Deno.env.get("EMAIL_BATCH_SIZE") || "30");
const MAX_ATTEMPTS = Number(Deno.env.get("EMAIL_MAX_ATTEMPTS") || "3");

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// The handler function for the Edge Function
serve(async (req) => {
  // Initialize metrics
  const metrics = {
    total: 0,
    sent: 0,
    failed: 0,
    retried: 0,
    errors: [] as string[],
  };

  try {
    console.log(`Starting email batch process. Batch size: ${BATCH_SIZE}`);
    
    // 1. Fetch pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Failed to fetch pending emails: ${fetchError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails to process" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    metrics.total = pendingEmails.length;
    console.log(`Found ${pendingEmails.length} pending emails to process`);

    // 2. Configure SMTP client
    const client = new SmtpClient();
    
    try {
      await client.connectTLS({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASS,
      });
    } catch (smtpError) {
      throw new Error(`SMTP connection failed: ${smtpError.message}`);
    }

    // 3. Process each email
    for (const email of pendingEmails) {
      try {
        const variables = email.variables || {};
        const subject = variables.subject || "Message from Church";
        const body = variables.body || "";
        
        // Send the email
        await client.send({
          from: FROM_ADDRESS,
          to: email.to_address,
          subject: subject,
          content: body,
          html: body,
        });

        // Update the email status to sent
        await supabase
          .from("email_queue")
          .update({ 
            status: "sent",
            attempts: email.attempts + 1
          })
          .eq("id", email.id);

        metrics.sent++;
        console.log(`Sent email ${email.id} to ${email.to_address}`);
      } catch (sendError) {
        metrics.failed++;
        const attempts = email.attempts + 1;
        const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
        
        if (status === "pending") {
          metrics.retried++;
        }

        // Record the error
        metrics.errors.push(`Email ${email.id}: ${sendError.message}`);

        // Update the email record with the error
        await supabase
          .from("email_queue")
          .update({
            status: status,
            attempts: attempts,
            last_error: sendError.message
          })
          .eq("id", email.id);

        console.error(`Failed to send email ${email.id} to ${email.to_address}. Attempt ${attempts}/${MAX_ATTEMPTS}`);
      }
    }

    // 4. Close the SMTP connection
    await client.close();

    // 5. Return response
    return new Response(
      JSON.stringify({
        message: "Email batch processed",
        metrics,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Batch processing error:", error.message);
    return new Response(
      JSON.stringify({
        message: "Error processing email batch",
        error: error.message,
        metrics,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}); 