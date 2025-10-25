-- Create comms_recipients table for the new comms system
-- Run this in Supabase Dashboard > SQL Editor

-- Create the comms_recipients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comms_recipients (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references public.comms_campaigns(id) on delete cascade,
  contact_id      uuid references public.contacts(id),
  to_address      text not null,
  variables       jsonb,
  status          text not null default 'pending',
  last_error      text,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Enable RLS
ALTER TABLE public.comms_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comms_recipients
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS comms_recipients_campaign_id_idx ON public.comms_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS comms_recipients_status_idx ON public.comms_recipients(status);
CREATE INDEX IF NOT EXISTS comms_recipients_contact_id_idx ON public.comms_recipients(contact_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comms_recipients TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_comms_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comms_recipients_updated_at ON public.comms_recipients;
CREATE TRIGGER update_comms_recipients_updated_at
BEFORE UPDATE ON public.comms_recipients
FOR EACH ROW
EXECUTE PROCEDURE update_comms_recipients_updated_at();

-- Also ensure comms_campaigns table exists
CREATE TABLE IF NOT EXISTS public.comms_campaigns (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid references public.comms_templates(id),
  name            text not null,
  channel         text not null,
  scheduled_at    timestamptz,
  status          text not null default 'draft',
  created_by      uuid references auth.users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Enable RLS on campaigns table too
ALTER TABLE public.comms_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comms_campaigns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_campaigns' 
        AND policyname = 'Allow read access to comms_campaigns for authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to comms_campaigns for authenticated users"
          ON public.comms_campaigns FOR SELECT
          TO authenticated
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_campaigns' 
        AND policyname = 'Allow insert access to comms_campaigns for authenticated users'
    ) THEN
        CREATE POLICY "Allow insert access to comms_campaigns for authenticated users"
          ON public.comms_campaigns FOR INSERT
          TO authenticated
          WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_campaigns' 
        AND policyname = 'Allow update access to comms_campaigns for authenticated users'
    ) THEN
        CREATE POLICY "Allow update access to comms_campaigns for authenticated users"
          ON public.comms_campaigns FOR UPDATE
          TO authenticated
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_campaigns' 
        AND policyname = 'Allow delete access to comms_campaigns for authenticated users'
    ) THEN
        CREATE POLICY "Allow delete access to comms_campaigns for authenticated users"
          ON public.comms_campaigns FOR DELETE
          TO authenticated
          USING (true);
    END IF;
END $$;

-- Also ensure comms_templates table exists
CREATE TABLE IF NOT EXISTS public.comms_templates (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  channel         text not null,
  subject         text,
  body            text not null,
  variables_schema jsonb default '[]',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Enable RLS on templates table
ALTER TABLE public.comms_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comms_templates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_templates' 
        AND policyname = 'Allow read access to comms_templates for authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to comms_templates for authenticated users"
          ON public.comms_templates FOR SELECT
          TO authenticated
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_templates' 
        AND policyname = 'Allow insert access to comms_templates for authenticated users'
    ) THEN
        CREATE POLICY "Allow insert access to comms_templates for authenticated users"
          ON public.comms_templates FOR INSERT
          TO authenticated
          WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_templates' 
        AND policyname = 'Allow update access to comms_templates for authenticated users'
    ) THEN
        CREATE POLICY "Allow update access to comms_templates for authenticated users"
          ON public.comms_templates FOR UPDATE
          TO authenticated
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_templates' 
        AND policyname = 'Allow delete access to comms_templates for authenticated users'
    ) THEN
        CREATE POLICY "Allow delete access to comms_templates for authenticated users"
          ON public.comms_templates FOR DELETE
          TO authenticated
          USING (true);
    END IF;
END $$;

-- Insert a sample template for testing
INSERT INTO public.comms_templates (name, channel, subject, body, variables_schema)
VALUES (
  'Welcome Email',
  'email',
  'Welcome to our Church!',
  '<p>Hello {{name}},</p><p>Welcome to our church community! We are glad to have you with us.</p><p>Blessings,<br>Church Team</p>',
  '[{"name": "name", "type": "string", "required": true}]'
)
ON CONFLICT DO NOTHING;

-- Display completion message
SELECT 'Comms tables created successfully!' as message; 