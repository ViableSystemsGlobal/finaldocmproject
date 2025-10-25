-- Create the soul_winning table conditionally
DO $$
BEGIN
    -- Create table without foreign key constraints first
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'soul_winning') THEN
        CREATE TABLE soul_winning (
          contact_id UUID PRIMARY KEY,
          saved BOOLEAN NOT NULL DEFAULT false,
          inviter_type TEXT NOT NULL,
          inviter_contact_id UUID,
          inviter_name TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          converted_to TEXT DEFAULT NULL,
          converted_at TIMESTAMPTZ DEFAULT NULL
        );

        -- Add comments
        COMMENT ON TABLE soul_winning IS 'Records of soul winning activities and salvation decisions';
        COMMENT ON COLUMN soul_winning.contact_id IS 'ID of the contact who is the subject of soul winning';
        COMMENT ON COLUMN soul_winning.saved IS 'Whether the person has made a salvation decision';
        COMMENT ON COLUMN soul_winning.inviter_type IS 'Category of how the person was invited/connected';
        COMMENT ON COLUMN soul_winning.inviter_contact_id IS 'ID of the contact who invited this person (if applicable)';
        COMMENT ON COLUMN soul_winning.inviter_name IS 'Name of inviter if not a contact in the system';
        COMMENT ON COLUMN soul_winning.converted_to IS 'Where the soul was converted to (visitor, member)';
        COMMENT ON COLUMN soul_winning.converted_at IS 'When the soul was converted';

        -- Create indexes
        CREATE INDEX idx_soul_winning_saved ON soul_winning(saved);
        CREATE INDEX idx_soul_winning_inviter_type ON soul_winning(inviter_type);
        CREATE INDEX idx_soul_winning_converted_to ON soul_winning(converted_to);
    END IF;

    -- Add foreign key constraints if contacts table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        -- Add primary contact foreign key constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'soul_winning_contact_id_fkey' 
            AND table_name = 'soul_winning'
        ) THEN
            ALTER TABLE soul_winning 
            ADD CONSTRAINT soul_winning_contact_id_fkey 
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
        END IF;

        -- Add inviter contact foreign key constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'soul_winning_inviter_contact_id_fkey' 
            AND table_name = 'soul_winning'
        ) THEN
            ALTER TABLE soul_winning 
            ADD CONSTRAINT soul_winning_inviter_contact_id_fkey 
            FOREIGN KEY (inviter_contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
        END IF;
    END IF;
END
$$;
