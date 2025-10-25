-- Create schema if it doesn't exist
create schema if not exists comms;

-- Create campaigns table
create table if not exists public.campaigns (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  subject         text        not null,
  body            text        not null,
  status          text        not null default 'draft',
  schedule_time   timestamptz,
  sender_id       uuid,
  template_id     uuid,
  recipient_count int,
  sent_count      int,
  variables       jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Create campaign recipients table
create table if not exists public.campaign_recipients (
  id              uuid        primary key default gen_random_uuid(),
  campaign_id     uuid        not null references public.campaigns(id) on delete cascade,
  contact_id      uuid        not null,
  to_address      text        not null,
  variables       jsonb,
  status          text        not null default 'pending',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Add indexes
create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists campaign_recipients_campaign_id_idx on public.campaign_recipients(campaign_id);
create index if not exists campaign_recipients_status_idx on public.campaign_recipients(status);

-- Add RLS
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;

-- Add policies (commented out since they may already exist)
-- drop policy if exists "Communications staff can manage campaigns" on public.campaigns;
-- drop policy if exists "Communications staff can manage campaign recipients" on public.campaign_recipients;

/* These policies may already exist - execute them manually if needed
create policy "Communications staff can manage campaigns"
  on public.campaigns
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'communications');

create policy "Communications staff can manage campaign recipients"
  on public.campaign_recipients
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'communications');
*/

-- Create triggers to update the updated_at field
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop existing triggers if they exist
drop trigger if exists set_campaigns_updated_at on public.campaigns;
drop trigger if exists set_campaign_recipients_updated_at on public.campaign_recipients;

-- Create new triggers
create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create trigger set_campaign_recipients_updated_at
  before update on public.campaign_recipients
  for each row execute function public.set_updated_at();

-- Add comments
comment on table public.campaigns is 'Email campaigns';
comment on table public.campaign_recipients is 'Recipients for email campaigns';

-- Create function to get campaign statistics
create or replace function public.get_campaign_stats(campaign_uuid uuid)
returns table (
  total_recipients bigint,
  pending_count bigint,
  sent_count bigint,
  failed_count bigint
)
language sql
security definer
as $$
  select
    count(*) as total_recipients,
    count(*) filter (where status = 'pending') as pending_count,
    count(*) filter (where status = 'sent') as sent_count,
    count(*) filter (where status = 'failed') as failed_count
  from public.campaign_recipients
  where campaign_id = campaign_uuid;
$$; 