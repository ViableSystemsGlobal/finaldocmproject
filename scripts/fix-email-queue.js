/**
 * Fix Email Queue Schema Issues
 * 
 * This script uses the Supabase JS client to run SQL commands
 * that fix schema cache issues with the email queue table.
 */

import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

// Create a Supabase client with admin privileges
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Starting email queue fix script...');

  try {
    // Fix the email_queue table
    console.log('Fixing email_queue table...');
    const { error: fixError } = await supabaseAdmin.rpc(
      'execute_sql',
      {
        sql: `
          -- Drop the table if it exists and recreate it properly
          DROP TABLE IF EXISTS email_queue;
          
          -- Create Email Queue Table with ALL required columns
          CREATE TABLE email_queue (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            to_address TEXT NOT NULL,
            from_address TEXT NOT NULL,
            subject TEXT NOT NULL,
            html_body TEXT NOT NULL,
            text_body TEXT,
            attachments JSONB,
            metadata JSONB,
            status TEXT NOT NULL DEFAULT 'pending',
            attempts INTEGER NOT NULL DEFAULT 0,
            max_attempts INTEGER NOT NULL DEFAULT 3,
            error_message TEXT,
            last_attempt_at TIMESTAMPTZ,
            next_attempt_at TIMESTAMPTZ,
            sent_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            -- Add validation constraint for status
            CONSTRAINT valid_status CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled'))
          );
          
          -- Create index on status and next_attempt
          CREATE INDEX idx_email_queue_status_next_attempt 
          ON email_queue(status, next_attempt_at)
          WHERE status IN ('pending', 'failed');
          
          -- Grant permissions
          GRANT SELECT, INSERT, UPDATE ON email_queue TO authenticated;
          GRANT SELECT, INSERT, UPDATE ON email_queue TO anon;
          
          -- Create or verify the email_tracking table
          CREATE TABLE IF NOT EXISTS email_tracking (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email_id UUID NOT NULL REFERENCES email_queue(id),
            event_type TEXT NOT NULL,
            event_data JSONB,
            user_agent TEXT,
            ip_address TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            -- Add validation constraint for event_type
            CONSTRAINT valid_event_type CHECK (event_type IN ('open', 'click', 'bounce', 'complaint', 'delivery'))
          );
          
          -- Create index on email_id
          CREATE INDEX IF NOT EXISTS idx_email_tracking_email_id 
          ON email_tracking(email_id);
          
          -- Grant permissions on tracking table
          GRANT SELECT, INSERT, UPDATE ON email_tracking TO authenticated;
          GRANT SELECT, INSERT, UPDATE ON email_tracking TO anon;
          
          -- Reload schema
          SELECT pg_notify('pgrst', 'reload schema');
        `
      }
    );

    if (fixError) {
      console.error('Error fixing email_queue table:', fixError);
      
      // Try a less aggressive approach
      console.log('Trying less aggressive approach...');
      const { error: gentleFixError } = await supabaseAdmin.rpc(
        'execute_sql',
        {
          sql: `
            -- Verify all required columns exist or add them
            DO $$
            DECLARE
              column_names text[] := ARRAY['to_address', 'from_address', 'subject', 'html_body', 'text_body', 
                                         'attachments', 'metadata', 'status', 'attempts', 'max_attempts',
                                         'error_message', 'last_attempt_at', 'next_attempt_at', 'sent_at',
                                         'created_at', 'updated_at'];
              col_name text;
            BEGIN
              -- Check each column
              FOREACH col_name IN ARRAY column_names
              LOOP
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'email_queue' AND column_name = col_name
                ) THEN
                  EXECUTE format('ALTER TABLE email_queue ADD COLUMN %I TEXT', col_name);
                END IF;
              END LOOP;
              
              -- Set NOT NULL constraints for required fields
              ALTER TABLE email_queue ALTER COLUMN to_address SET NOT NULL;
              ALTER TABLE email_queue ALTER COLUMN from_address SET NOT NULL;
              ALTER TABLE email_queue ALTER COLUMN subject SET NOT NULL;
              ALTER TABLE email_queue ALTER COLUMN html_body SET NOT NULL;
              ALTER TABLE email_queue ALTER COLUMN status SET NOT NULL;
            END
            $$;
            
            -- Reload schema
            SELECT pg_notify('pgrst', 'reload schema');
          `
        }
      );
      
      if (gentleFixError) {
        console.error('Gentle fix also failed:', gentleFixError);
        throw new Error('Failed to fix schema cache issues');
      } else {
        console.log('Gentle fix approach succeeded!');
      }
    } else {
      console.log('Complete table rebuild succeeded!');
    }

    console.log('Email queue fixed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 