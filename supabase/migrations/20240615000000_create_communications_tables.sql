-- Templates for all channels
create table if not exists public.comms_templates (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  channel         text not null,          -- 'email'|'sms'|'whatsapp'|'push'
  subject         text,                   -- only for email/push
  body            text not null,          -- markdown/HTML for email, plain text for SMS/WhatsApp
  variables_schema jsonb default '[]',    -- JSON Schema for template variables
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Add RLS policies for comms_templates
alter table public.comms_templates enable row level security;

create policy "Allow read access to comms_templates for authenticated users"
  on public.comms_templates for select
  to authenticated
  using (true);

create policy "Allow insert access to comms_templates for authenticated users"
  on public.comms_templates for insert
  to authenticated
  with check (true);

create policy "Allow update access to comms_templates for authenticated users"
  on public.comms_templates for update
  to authenticated
  using (true);

create policy "Allow delete access to comms_templates for authenticated users"
  on public.comms_templates for delete
  to authenticated
  using (true);

-- Campaigns (batches) built from a template
create table if not exists public.comms_campaigns (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid references public.comms_templates(id),
  name            text not null,
  channel         text not null,
  scheduled_at    timestamptz,            -- null = send immediately
  status          text not null default 'draft',  -- 'draft'|'scheduled'|'sending'|'completed'
  created_by      uuid references auth.users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Add RLS policies for comms_campaigns
alter table public.comms_campaigns enable row level security;

create policy "Allow read access to comms_campaigns for authenticated users"
  on public.comms_campaigns for select
  to authenticated
  using (true);

create policy "Allow insert access to comms_campaigns for authenticated users"
  on public.comms_campaigns for insert
  to authenticated
  with check (true);

create policy "Allow update access to comms_campaigns for authenticated users"
  on public.comms_campaigns for update
  to authenticated
  using (true);

create policy "Allow delete access to comms_campaigns for authenticated users"
  on public.comms_campaigns for delete
  to authenticated
  using (true);

-- Individual recipients for reporting & retries (create table conditionally)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comms_recipients') THEN
        CREATE TABLE public.comms_recipients (
          id              uuid primary key default gen_random_uuid(),
          campaign_id     uuid references public.comms_campaigns(id) on delete cascade,
          contact_id      uuid,               -- Will add foreign key constraint later if contacts table exists
          to_address      text not null,       -- email or phone or push_token
          variables       jsonb,               -- payload for this recipient
          status          text not null default 'pending',  -- 'pending'|'sent'|'failed'|'delivered'|'opened'|'clicked'
          last_error      text,
          sent_at         timestamptz,
          delivered_at    timestamptz,
          opened_at       timestamptz,
          clicked_at      timestamptz
        );

        -- Add RLS policies for comms_recipients
        ALTER TABLE public.comms_recipients ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Allow read access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR SELECT
          TO authenticated
          USING (true);

        CREATE POLICY "Allow insert access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR INSERT
          TO authenticated
          WITH CHECK (true);

        CREATE POLICY "Allow update access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR UPDATE
          TO authenticated
          USING (true);

        CREATE POLICY "Allow delete access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR DELETE
          TO authenticated
          USING (true);
    END IF;

    -- Add foreign key constraint if contacts table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        -- Check if the constraint doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'comms_recipients_contact_id_fkey' 
            AND table_name = 'comms_recipients'
        ) THEN
            ALTER TABLE public.comms_recipients 
            ADD CONSTRAINT comms_recipients_contact_id_fkey 
            FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
        END IF;
    END IF;
END
$$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comms_templates_updated_at
BEFORE UPDATE ON public.comms_templates
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_comms_campaigns_updated_at
BEFORE UPDATE ON public.comms_campaigns
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Create metrics functions
CREATE OR REPLACE FUNCTION public.get_comms_campaign_metrics(campaign_id UUID)
RETURNS TABLE (
  total_recipients INTEGER,
  pending_count INTEGER,
  sent_count INTEGER,
  delivered_count INTEGER,
  opened_count INTEGER,
  clicked_count INTEGER,
  failed_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_recipients,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_count,
    COUNT(*) FILTER (WHERE status = 'sent')::INTEGER AS sent_count,
    COUNT(*) FILTER (WHERE status = 'delivered')::INTEGER AS delivered_count,
    COUNT(*) FILTER (WHERE status = 'opened')::INTEGER AS opened_count,
    COUNT(*) FILTER (WHERE status = 'clicked')::INTEGER AS clicked_count,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER AS failed_count
  FROM
    public.comms_recipients
  WHERE
    campaign_id = $1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_comms_metrics()
RETURNS TABLE (
  total_campaigns INTEGER,
  active_campaigns INTEGER,
  scheduled_campaigns INTEGER,
  completed_campaigns INTEGER,
  total_templates INTEGER,
  email_templates INTEGER,
  sms_templates INTEGER,
  whatsapp_templates INTEGER,
  push_templates INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns) AS total_campaigns,
    (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns WHERE status IN ('draft', 'sending')) AS active_campaigns,
    (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns WHERE status = 'scheduled') AS scheduled_campaigns,
    (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns WHERE status = 'completed') AS completed_campaigns,
    (SELECT COUNT(*)::INTEGER FROM public.comms_templates) AS total_templates,
    (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'email') AS email_templates,
    (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'sms') AS sms_templates,
    (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'whatsapp') AS whatsapp_templates,
    (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'push') AS push_templates;
END;
$$ LANGUAGE plpgsql; 