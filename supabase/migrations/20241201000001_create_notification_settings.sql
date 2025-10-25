-- Create notification_settings table for global settings
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_enabled         boolean NOT NULL DEFAULT true,
  sms_enabled           boolean NOT NULL DEFAULT true,
  push_enabled          boolean NOT NULL DEFAULT true,
  in_app_enabled        boolean NOT NULL DEFAULT true,
  quiet_hours_enabled   boolean NOT NULL DEFAULT true,
  quiet_hours_start     time NOT NULL DEFAULT '22:00:00',
  quiet_hours_end       time NOT NULL DEFAULT '08:00:00',
  digest_mode_enabled   boolean NOT NULL DEFAULT false,
  digest_frequency      text NOT NULL DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly')),
  digest_time           time NOT NULL DEFAULT '09:00:00',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Create notification_types table for different notification categories
CREATE TABLE IF NOT EXISTS public.notification_types (
  id                    text PRIMARY KEY,
  name                  text NOT NULL,
  description           text NOT NULL,
  category              text NOT NULL,
  default_email         boolean NOT NULL DEFAULT true,
  default_sms           boolean NOT NULL DEFAULT false,
  default_push          boolean NOT NULL DEFAULT true,
  default_in_app        boolean NOT NULL DEFAULT true,
  urgency_level         text NOT NULL DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  enabled               boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Create notification_type_settings table for per-type configurations
CREATE TABLE IF NOT EXISTS public.notification_type_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type_id  text NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
  method                text NOT NULL CHECK (method IN ('email', 'sms', 'push', 'in_app')),
  enabled               boolean NOT NULL DEFAULT true,
  roles                 jsonb NOT NULL DEFAULT '[]',
  template_override     text,
  delay_minutes         integer DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(notification_type_id, method)
);

-- Create role_notification_preferences table for user role defaults
CREATE TABLE IF NOT EXISTS public.role_notification_preferences (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id               text NOT NULL,
  role_name             text NOT NULL,
  email_enabled         boolean NOT NULL DEFAULT true,
  sms_enabled           boolean NOT NULL DEFAULT false,
  push_enabled          boolean NOT NULL DEFAULT true,
  in_app_enabled        boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(role_id)
);

-- Create user_notification_preferences table for individual user overrides
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL,
  notification_type_id  text NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
  method                text NOT NULL CHECK (method IN ('email', 'sms', 'push', 'in_app')),
  enabled               boolean NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, notification_type_id, method)
);

-- Add RLS policies
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_type_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for notification_settings
CREATE POLICY "Allow read access to notification_settings for authenticated users"
  ON public.notification_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to notification_settings for authenticated users"
  ON public.notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to notification_settings for authenticated users"
  ON public.notification_settings FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for notification_types
CREATE POLICY "Allow read access to notification_types for authenticated users"
  ON public.notification_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to notification_types for authenticated users"
  ON public.notification_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to notification_types for authenticated users"
  ON public.notification_types FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for notification_type_settings
CREATE POLICY "Allow read access to notification_type_settings for authenticated users"
  ON public.notification_type_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to notification_type_settings for authenticated users"
  ON public.notification_type_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to notification_type_settings for authenticated users"
  ON public.notification_type_settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete access to notification_type_settings for authenticated users"
  ON public.notification_type_settings FOR DELETE
  TO authenticated
  USING (true);

-- Policies for role_notification_preferences
CREATE POLICY "Allow read access to role_notification_preferences for authenticated users"
  ON public.role_notification_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to role_notification_preferences for authenticated users"
  ON public.role_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to role_notification_preferences for authenticated users"
  ON public.role_notification_preferences FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for user_notification_preferences
CREATE POLICY "Allow read access to user_notification_preferences for authenticated users"
  ON public.user_notification_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to user_notification_preferences for authenticated users"
  ON public.user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to user_notification_preferences for authenticated users"
  ON public.user_notification_preferences FOR UPDATE
  TO authenticated
  USING (true);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE PROCEDURE update_notification_settings_updated_at();

CREATE TRIGGER update_notification_types_updated_at
BEFORE UPDATE ON public.notification_types
FOR EACH ROW
EXECUTE PROCEDURE update_notification_settings_updated_at();

CREATE TRIGGER update_notification_type_settings_updated_at
BEFORE UPDATE ON public.notification_type_settings
FOR EACH ROW
EXECUTE PROCEDURE update_notification_settings_updated_at();

CREATE TRIGGER update_role_notification_preferences_updated_at
BEFORE UPDATE ON public.role_notification_preferences
FOR EACH ROW
EXECUTE PROCEDURE update_notification_settings_updated_at();

CREATE TRIGGER update_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE PROCEDURE update_notification_settings_updated_at();

-- Insert default notification types
INSERT INTO public.notification_types (id, name, description, category, default_email, default_sms, default_push, default_in_app, urgency_level) VALUES
('member_joined', 'Member Joined', 'When a new member joins the church', 'membership', true, false, true, true, 'normal'),
('visitor_first_time', 'First-Time Visitor', 'When someone visits for the first time', 'visitors', true, false, true, true, 'normal'),
('event_reminder', 'Event Reminders', 'Reminders for upcoming events', 'events', true, true, true, true, 'normal'),
('donation_received', 'Donation Received', 'When a donation is processed', 'giving', true, false, false, true, 'low'),
('prayer_request', 'Prayer Request', 'New prayer request submitted', 'pastoral', true, false, true, true, 'high'),
('follow_up_due', 'Follow-up Due', 'When a follow-up task becomes due', 'pastoral', true, false, true, true, 'normal'),
('system_maintenance', 'System Maintenance', 'System maintenance notifications', 'system', true, false, false, true, 'normal'),
('security_alert', 'Security Alerts', 'Security-related notifications', 'system', true, true, true, true, 'critical')
ON CONFLICT (id) DO NOTHING;

-- Insert default notification type settings
INSERT INTO public.notification_type_settings (notification_type_id, method, enabled, roles) VALUES
-- Member Joined
('member_joined', 'email', true, '["admin", "pastor"]'),
('member_joined', 'sms', false, '["admin"]'),
('member_joined', 'push', true, '["admin", "pastor", "staff"]'),
('member_joined', 'in_app', true, '["admin", "pastor", "staff"]'),

-- First-Time Visitor
('visitor_first_time', 'email', true, '["admin", "pastor"]'),
('visitor_first_time', 'sms', false, '["admin"]'),
('visitor_first_time', 'push', true, '["admin", "pastor", "staff"]'),
('visitor_first_time', 'in_app', true, '["admin", "pastor", "staff"]'),

-- Event Reminders
('event_reminder', 'email', true, '["admin", "pastor", "staff"]'),
('event_reminder', 'sms', true, '["admin", "pastor"]'),
('event_reminder', 'push', true, '["admin", "pastor", "staff", "volunteer"]'),
('event_reminder', 'in_app', true, '["admin", "pastor", "staff", "volunteer"]'),

-- Donation Received
('donation_received', 'email', true, '["admin", "pastor"]'),
('donation_received', 'sms', false, '[]'),
('donation_received', 'push', false, '[]'),
('donation_received', 'in_app', true, '["admin", "pastor"]'),

-- Prayer Request
('prayer_request', 'email', true, '["admin", "pastor"]'),
('prayer_request', 'sms', false, '["admin"]'),
('prayer_request', 'push', true, '["admin", "pastor"]'),
('prayer_request', 'in_app', true, '["admin", "pastor", "staff"]'),

-- Follow-up Due
('follow_up_due', 'email', true, '["admin", "pastor", "staff"]'),
('follow_up_due', 'sms', false, '["admin"]'),
('follow_up_due', 'push', true, '["admin", "pastor", "staff"]'),
('follow_up_due', 'in_app', true, '["admin", "pastor", "staff"]'),

-- System Maintenance
('system_maintenance', 'email', true, '["admin"]'),
('system_maintenance', 'sms', false, '[]'),
('system_maintenance', 'push', false, '[]'),
('system_maintenance', 'in_app', true, '["admin"]'),

-- Security Alerts
('security_alert', 'email', true, '["admin"]'),
('security_alert', 'sms', true, '["admin"]'),
('security_alert', 'push', true, '["admin"]'),
('security_alert', 'in_app', true, '["admin"]')
ON CONFLICT (notification_type_id, method) DO NOTHING;

-- Insert default role preferences
INSERT INTO public.role_notification_preferences (role_id, role_name, email_enabled, sms_enabled, push_enabled, in_app_enabled) VALUES
('admin', 'Administrator', true, true, true, true),
('pastor', 'Pastor', true, false, true, true),
('staff', 'Staff', true, false, true, true),
('volunteer', 'Volunteer', true, false, true, true),
('member', 'Member', true, false, false, false)
ON CONFLICT (role_id) DO NOTHING;

-- Insert default global settings
INSERT INTO public.notification_settings (
  email_enabled, 
  sms_enabled, 
  push_enabled, 
  in_app_enabled,
  quiet_hours_enabled,
  quiet_hours_start,
  quiet_hours_end,
  digest_mode_enabled,
  digest_frequency,
  digest_time
) VALUES (
  true, 
  true, 
  true, 
  true,
  true,
  '22:00:00',
  '08:00:00',
  false,
  'daily',
  '09:00:00'
) ON CONFLICT DO NOTHING; 