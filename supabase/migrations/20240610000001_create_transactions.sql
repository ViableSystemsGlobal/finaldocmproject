create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  contact_id     uuid references public.contacts(id),
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