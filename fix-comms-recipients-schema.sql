-- Fix missing columns in comms_recipients table
DO $$
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comms_recipients' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.comms_recipients 
        ADD COLUMN created_at timestamptz DEFAULT now();
        
        -- Update existing rows to have a created_at value
        UPDATE public.comms_recipients 
        SET created_at = now() 
        WHERE created_at IS NULL;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comms_recipients' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.comms_recipients 
        ADD COLUMN updated_at timestamptz DEFAULT now();
        
        -- Update existing rows to have an updated_at value
        UPDATE public.comms_recipients 
        SET updated_at = now() 
        WHERE updated_at IS NULL;
    END IF;

    -- Create trigger for updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_comms_recipients_updated_at'
    ) THEN
        CREATE TRIGGER update_comms_recipients_updated_at
        BEFORE UPDATE ON public.comms_recipients
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
    END IF;
END
$$;

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comms_recipients' 
ORDER BY ordinal_position; 