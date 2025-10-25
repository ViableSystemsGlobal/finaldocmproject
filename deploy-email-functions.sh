#!/bin/bash
# Deploy email-related Supabase Edge Functions

# Process Email Queue Function
echo "Deploying process_email_queue Edge Function..."
supabase functions deploy process_email_queue --no-verify-jwt

# Email Tracking Function
echo "Deploying track_email Edge Function..."
supabase functions deploy track_email --no-verify-jwt

# Set environment variables
echo "Setting environment variables..."
supabase secrets set SMTP_HOST=smtp.hostinger.com
supabase secrets set SMTP_PORT=465
supabase secrets set EMAIL_PASSWORD="4R*]IL4QyS\$"
supabase secrets set FROM_NAME="DOCM Church"
supabase secrets set EMAIL_BATCH_SIZE=20
supabase secrets set EMAIL_MAX_ATTEMPTS=3

echo "Deployment complete!" 