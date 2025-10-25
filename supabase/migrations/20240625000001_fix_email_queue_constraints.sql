-- Fix potential issues with email_queue table

-- Make sure primary key constraint is properly set
DO $$
BEGIN
    -- Check and fix primary key constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'email_queue_pkey' 
        AND conrelid = 'email_queue'::regclass
    ) THEN
        ALTER TABLE email_queue ADD PRIMARY KEY (id);
    END IF;
    
    -- Check and add auto-generation of UUIDs if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'email_queue_id_key'
        AND conrelid = 'email_queue'::regclass
    ) THEN
        ALTER TABLE email_queue ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
    
    -- Check and fix data types that might be problematic
    -- Check if metadata is JSONB
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_queue' 
        AND column_name = 'metadata' 
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE email_queue ALTER COLUMN metadata TYPE JSONB USING metadata::jsonb;
    END IF;
    
    -- Make sure timestamp columns use TIMESTAMPTZ
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_queue' 
        AND column_name = 'next_attempt_at' 
        AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE email_queue 
        ALTER COLUMN next_attempt_at TYPE TIMESTAMPTZ USING next_attempt_at::TIMESTAMPTZ,
        ALTER COLUMN last_attempt_at TYPE TIMESTAMPTZ USING last_attempt_at::TIMESTAMPTZ,
        ALTER COLUMN sent_at TYPE TIMESTAMPTZ USING sent_at::TIMESTAMPTZ,
        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ,
        ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::TIMESTAMPTZ;
    END IF;
    
    -- Ensure all NOT NULL constraints are properly set
    ALTER TABLE email_queue 
    ALTER COLUMN to_address SET NOT NULL,
    ALTER COLUMN from_address SET NOT NULL,
    ALTER COLUMN subject SET NOT NULL,
    ALTER COLUMN html_body SET NOT NULL,
    ALTER COLUMN status SET NOT NULL;
    
    -- Add default values
    ALTER TABLE email_queue 
    ALTER COLUMN attempts SET DEFAULT 0,
    ALTER COLUMN max_attempts SET DEFAULT 3,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW(),
    ALTER COLUMN status SET DEFAULT 'pending';
END
$$; 