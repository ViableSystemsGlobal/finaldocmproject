-- Fix group_memberships table by adding missing columns

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_memberships' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.group_memberships ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

-- Add joined_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_memberships' 
        AND column_name = 'joined_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.group_memberships ADD COLUMN joined_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Add role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_memberships' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.group_memberships ADD COLUMN role text DEFAULT 'Member';
    END IF;
END $$; 