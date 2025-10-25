-- Add follow-up assignment notification type
-- This migration adds the notification type for when follow-ups are assigned to users

-- Insert the new notification type
INSERT INTO public.notification_types (id, name, description, category, default_email, default_sms, default_push, default_in_app, urgency_level) VALUES
('follow_up_assigned', 'Follow-up Assigned', 'When a follow-up task is assigned to you', 'pastoral', true, false, true, true, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Insert default notification type settings for follow-up assigned
INSERT INTO public.notification_type_settings (notification_type_id, method, enabled, roles) VALUES
-- Follow-up Assigned
('follow_up_assigned', 'email', true, '["admin", "pastor", "staff", "volunteer"]'),
('follow_up_assigned', 'sms', false, '["admin"]'),
('follow_up_assigned', 'push', true, '["admin", "pastor", "staff", "volunteer"]'),
('follow_up_assigned', 'in_app', true, '["admin", "pastor", "staff", "volunteer"]')
ON CONFLICT (notification_type_id, method) DO NOTHING; 