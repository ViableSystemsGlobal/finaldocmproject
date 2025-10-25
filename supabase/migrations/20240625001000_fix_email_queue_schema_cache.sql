-- Fix PostgREST schema cache issues with email_queue table

-- First make sure the column exists with the right definition
DO $$
BEGIN
    -- Check if the column exists first
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'email_queue' AND column_name = 'from_address'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE email_queue ADD COLUMN from_address TEXT NOT NULL DEFAULT 'system@docmchurch.org';
    ELSE
        -- Make sure it has the right definition
        ALTER TABLE email_queue ALTER COLUMN from_address TYPE TEXT;
        ALTER TABLE email_queue ALTER COLUMN from_address SET NOT NULL;
    END IF;
END
$$;

-- Explicitly reload the schema cache for PostgREST
-- This fixes the "Could not find column in schema cache" error
SELECT pg_notify('pgrst', 'reload schema');

-- Grant explicit access to the table
GRANT SELECT, INSERT, UPDATE ON email_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_queue TO anon;

-- Only grant sequence permission if the sequence exists (for serial primary keys)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.sequences
        WHERE sequence_name = 'email_queue_id_seq'
    ) THEN
        EXECUTE 'GRANT USAGE ON SEQUENCE email_queue_id_seq TO authenticated, anon';
    ELSE
        RAISE NOTICE 'Sequence email_queue_id_seq not found - table likely uses UUIDs instead of serial';
    END IF;
END
$$;

-- Create a simple function to verify the table structure
CREATE OR REPLACE FUNCTION get_email_queue_structure()
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT jsonb_build_object(
        'columns', (
            SELECT jsonb_agg(jsonb_build_object(
                'column_name', column_name,
                'data_type', data_type,
                'is_nullable', is_nullable
            ))
            FROM information_schema.columns
            WHERE table_name = 'email_queue'
        ),
        'primary_key', (
            SELECT jsonb_agg(kcu.column_name)
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_name = 'email_queue'
        ),
        'table_exists', (
            SELECT EXISTS (
                SELECT 1 FROM pg_tables
                WHERE schemaname = 'public' AND tablename = 'email_queue'
            )
        )
    );
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION get_email_queue_structure() TO authenticated; 