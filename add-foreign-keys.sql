-- Add missing foreign key constraints to fix discipleship groups campus relationship
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. First, ensure all discipleship groups have valid campus_id values
UPDATE discipleship_groups 
SET campus_id = (SELECT id FROM campuses WHERE name = 'Main Campus' LIMIT 1)
WHERE campus_id IS NULL OR campus_id NOT IN (SELECT id FROM campuses);

-- 2. Add foreign key constraint from discipleship_groups to campuses (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discipleship_groups_campus_id_fkey'
        AND table_name = 'discipleship_groups'
    ) THEN
        ALTER TABLE discipleship_groups 
        ADD CONSTRAINT discipleship_groups_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES campuses(id);
        RAISE NOTICE 'Added discipleship_groups_campus_id_fkey constraint';
    ELSE
        RAISE NOTICE 'discipleship_groups_campus_id_fkey constraint already exists';
    END IF;
END $$;

-- 3. Add foreign key constraint from discipleship_groups to contacts (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discipleship_groups_leader_id_fkey'
        AND table_name = 'discipleship_groups'
    ) THEN
        ALTER TABLE discipleship_groups 
        ADD CONSTRAINT discipleship_groups_leader_id_fkey 
        FOREIGN KEY (leader_id) REFERENCES contacts(id);
        RAISE NOTICE 'Added discipleship_groups_leader_id_fkey constraint';
    ELSE
        RAISE NOTICE 'discipleship_groups_leader_id_fkey constraint already exists';
    END IF;
END $$;

-- 4. Add foreign key constraint from groups to campuses (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_campus_id_fkey'
        AND table_name = 'groups'
    ) THEN
        ALTER TABLE groups 
        ADD CONSTRAINT groups_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES campuses(id);
        RAISE NOTICE 'Added groups_campus_id_fkey constraint';
    ELSE
        RAISE NOTICE 'groups_campus_id_fkey constraint already exists';
    END IF;
END $$;

-- 5. Refresh PostgREST schema cache to recognize new relationships
NOTIFY pgrst, 'reload schema'; 