create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  amount       numeric(10,2) not null,
  category     text not null default 'General',
  vendor       text,
  spent_at     date not null default current_date,
  notes        text,
  created_at   timestamptz not null default now(),
  tenant_id    uuid default 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy that allows all operations for authenticated users
CREATE POLICY expenses_all_operations_policy
ON public.expenses
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX expenses_spent_at_idx ON public.expenses(spent_at);
CREATE INDEX expenses_tenant_id_idx ON public.expenses(tenant_id); 