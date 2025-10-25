-- Pages
create table if not exists public.pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  seo_meta     jsonb default '{}',
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Sections
create table if not exists public.page_sections (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid references public.pages(id) on delete cascade,
  type       text not null,
  "order"    int not null,
  props      jsonb not null,
  created_at timestamptz default now()
);

-- Media Library
create table if not exists public.media_library (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  type        text not null,
  alt_text    text,
  uploaded_at timestamptz default now()
);

-- Add RLS policies
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.media_library enable row level security;

-- Create policies (for development, allow all authenticated users to access and modify)
create policy "Allow all authenticated users to read"
  on public.pages for select
  using (auth.role() = 'authenticated');

create policy "Allow all authenticated users to modify during development"
  on public.pages for all
  using (auth.role() = 'authenticated');

create policy "Allow all authenticated users to read sections"
  on public.page_sections for select
  using (auth.role() = 'authenticated');

create policy "Allow all authenticated users to modify sections during development"
  on public.page_sections for all
  using (auth.role() = 'authenticated');

create policy "Allow all authenticated users to read media"
  on public.media_library for select
  using (auth.role() = 'authenticated');

create policy "Allow all authenticated users to modify media during development"
  on public.media_library for all
  using (auth.role() = 'authenticated');

-- TODO: Before moving to production, change the policies to:
-- create policy "Allow write access for admins"
--   on public.pages for all
--   using (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'admin'); 