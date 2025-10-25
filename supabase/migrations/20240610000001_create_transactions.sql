-- Create transactions table with conditional foreign key constraint
DO $$
BEGIN
    -- Create table without foreign key first
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        CREATE TABLE public.transactions (
          id             uuid primary key default gen_random_uuid(),
          contact_id     uuid,  -- Will add foreign key constraint later if contacts table exists
          amount         numeric(10,2) not null,
          currency       text not null default 'USD',
          category       text not null default 'General',
          payment_method text not null default 'Stripe',
          transacted_at  timestamptz not null default now(),
          notes          text,
          created_at     timestamptz not null default now(),
          tenant_id      uuid default 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        );

        -- Set up RLS (Row Level Security)
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

        -- Create a permissive policy that allows all operations for authenticated users
        CREATE POLICY transactions_all_operations_policy
        ON public.transactions
        FOR ALL
        USING (true)
        WITH CHECK (true);

        -- Create indexes for faster queries
        CREATE INDEX transactions_contact_id_idx ON public.transactions(contact_id);
        CREATE INDEX transactions_transacted_at_idx ON public.transactions(transacted_at);
        CREATE INDEX transactions_tenant_id_idx ON public.transactions(tenant_id);
    END IF;

    -- Add foreign key constraint if contacts table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        -- Check if the constraint doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'transactions_contact_id_fkey' 
            AND table_name = 'transactions'
        ) THEN
            ALTER TABLE public.transactions 
            ADD CONSTRAINT transactions_contact_id_fkey 
            FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
        END IF;
    END IF;
END
$$; 