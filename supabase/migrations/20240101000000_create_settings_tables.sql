-- Settings Tables Migration for CICS
-- Run with: supabase db push

-- 1. Church Info & Branding
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  address          TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  time_zone        TEXT        NOT NULL DEFAULT 'UTC',
  logo_url         TEXT,
  primary_color    TEXT        DEFAULT '#1A202C',
  secondary_color  TEXT        DEFAULT '#F6E05E',
  website          TEXT,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Campus Management
CREATE TABLE IF NOT EXISTS public.campuses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  zip_code    TEXT,
  country     TEXT        DEFAULT 'US',
  phone       TEXT,
  email       TEXT,
  is_main     BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Custom Fields
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity      TEXT        NOT NULL,           -- e.g. 'contacts','events','members'
  field_name  TEXT        NOT NULL,
  field_label TEXT        NOT NULL,
  field_type  TEXT        NOT NULL,           -- 'text','textarea','date','dropdown','toggle','number','email','phone'
  options     JSONB,                          -- for dropdown: ["Option A","Option B"]
  required    BOOLEAN     DEFAULT false,
  visible     BOOLEAN     DEFAULT true,
  "order"     INT         DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity, field_name)
);

-- 4. Workflows & Automations
CREATE TABLE IF NOT EXISTS public.workflows (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  description    TEXT,
  trigger_type   TEXT        NOT NULL,      -- 'on_create','on_update','scheduled','manual'
  trigger_config JSONB,                     -- e.g. { entity:'members', status:'new' } or { cron:'0 8 * * *' }
  is_active      BOOLEAN     DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id    UUID        REFERENCES public.workflows(id) ON DELETE CASCADE,
  step_type      TEXT        NOT NULL,      -- 'delay','send_email','send_sms','create_follow_up','assign_group','update_field'
  config         JSONB       NOT NULL,      -- step-specific config
  "order"        INT         NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Communication Templates Defaults
CREATE TABLE IF NOT EXISTS public.comms_defaults (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name  TEXT        NOT NULL,      -- e.g. 'welcome_member','birthday_reminder'
  channel        TEXT        NOT NULL,      -- 'email','sms','whatsapp','push'
  subject        TEXT,
  body           TEXT        NOT NULL,
  variables_schema JSONB     DEFAULT '[]',
  is_active      BOOLEAN     DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_name, channel)
);

-- 6. Giving Settings
CREATE TABLE IF NOT EXISTS public.giving_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,      -- e.g. 'Tithe','Building Fund','Missions'
  description TEXT,
  is_active   BOOLEAN     DEFAULT true,
  "order"     INT         DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Navigation & Footer
CREATE TABLE IF NOT EXISTS public.navigation (
  id          UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT   NOT NULL,
  href        TEXT   NOT NULL,
  "order"     INT    DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  parent_id   UUID   REFERENCES public.navigation(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.footer_blocks (
  id          UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  content     TEXT,
  block_type  TEXT   DEFAULT 'text',  -- 'text','links','contact','social'
  "order"     INT    DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Roles & Permissions
CREATE TABLE IF NOT EXISTS public.roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB       DEFAULT '[]',  -- array of permission strings
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     UUID        NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID        REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- 9. Integrations & API Keys
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT        NOT NULL UNIQUE,        -- 'twilio','sendgrid','stripe','maps','youtube'
  config      JSONB       NOT NULL,               -- e.g. { api_key:'...', secret:'...', enabled: true }
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. System Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id),
  action      TEXT        NOT NULL,      -- 'create','update','delete','login','logout'
  entity      TEXT        NOT NULL,      -- table or resource name
  entity_id   UUID,                      -- record id if applicable
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comms_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giving_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - allow authenticated admin users)
-- These should be customized based on your role system
CREATE POLICY "Allow authenticated access" ON public.tenant_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.campuses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.custom_fields FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.workflows FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.workflow_steps FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.comms_defaults FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.giving_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.navigation FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.footer_blocks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.roles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.user_roles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.integration_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- Insert default data
INSERT INTO public.roles (name, description, permissions) VALUES
  ('Admin', 'Full system access', '["all"]'),
  ('Staff', 'Standard staff access', '["people.read", "people.write", "events.read", "events.write", "comms.read", "comms.write"]'),
  ('Finance', 'Financial access', '["finance.read", "finance.write", "people.read"]'),
  ('Viewer', 'Read-only access', '["people.read", "events.read", "finance.read"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.giving_categories (name, description, "order") VALUES
  ('Tithe', 'Regular tithe offerings', 1),
  ('Building Fund', 'Building and facility improvements', 2),
  ('Missions', 'Missionary support and outreach', 3),
  ('Special Offering', 'Special events and needs', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.comms_defaults (template_name, channel, subject, body) VALUES
  ('welcome_member', 'email', 'Welcome to {{ church_name }}!', 'Dear {{ first_name }},\n\nWelcome to our church family! We are excited to have you join us.\n\nBlessings,\n{{ church_name }} Team'),
  ('birthday_reminder', 'email', 'Happy Birthday {{ first_name }}!', 'Happy Birthday {{ first_name }}!\n\nWishing you a wonderful day filled with God''s blessings.\n\nBlessings,\n{{ church_name }}'),
  ('follow_up_visitor', 'email', 'Thank you for visiting {{ church_name }}', 'Hi {{ first_name }},\n\nThank you for visiting us! We hope you felt welcomed and would love to see you again.\n\nBlessings,\n{{ church_name }}'),
  ('event_reminder', 'sms', '', 'Hi {{ first_name }}, reminder about {{ event_name }} tomorrow at {{ event_time }}. See you there!')
ON CONFLICT (template_name, channel) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON public.custom_fields(entity);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_navigation_order ON public.navigation("order");
CREATE INDEX IF NOT EXISTS idx_footer_blocks_order ON public.footer_blocks("order");

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campuses_updated_at BEFORE UPDATE ON public.campuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON public.custom_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON public.workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comms_defaults_updated_at BEFORE UPDATE ON public.comms_defaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_giving_categories_updated_at BEFORE UPDATE ON public.giving_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_navigation_updated_at BEFORE UPDATE ON public.navigation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_footer_blocks_updated_at BEFORE UPDATE ON public.footer_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 