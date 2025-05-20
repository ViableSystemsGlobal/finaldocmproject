create schema if not exists people;

create table people.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  phone text unique,
  email text unique,
  tenant_id uuid not null,
  campus_id uuid,
  lifecycle text not null default 'soul',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
); 