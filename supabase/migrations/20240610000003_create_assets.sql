create table if not exists public.assets (
  id                        uuid        primary key default gen_random_uuid(),
  name                      text        not null,
  purchase_date             date        not null,
  cost                      numeric(12,2) not null,
  depreciation_method       text        not null default 'straight-line',
  life_years                int         not null,
  accumulated_depreciation  numeric(12,2) not null default 0,
  created_at                timestamptz not null default now(),
  tenant_id                 uuid default 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy that allows all operations for authenticated users
CREATE POLICY assets_all_operations_policy
ON public.assets
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX assets_purchase_date_idx ON public.assets(purchase_date);
CREATE INDEX assets_tenant_id_idx ON public.assets(tenant_id); 