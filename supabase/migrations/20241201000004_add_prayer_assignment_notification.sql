-- Add prayer assignment notification type
-- This migration adds the notification type for when prayers are assigned to users

-- Insert the new notification type
INSERT INTO public.notification_types (id, name, description, category, default_email, default_sms, default_push, default_in_app, urgency_level) VALUES
('prayer_assigned', 'Prayer Assigned', 'When a prayer request is assigned to you', 'pastoral', true, false, true, true, 'normal')
ON CONFLICT (id) DO NOTHING;

-- Insert default notification type settings for prayer assigned
INSERT INTO public.notification_type_settings (notification_type_id, method, enabled, roles) VALUES
-- Prayer Assigned
('prayer_assigned', 'email', true, '["admin", "pastor", "staff", "volunteer"]'),
('prayer_assigned', 'sms', false, '["admin", "pastor"]'),
('prayer_assigned', 'push', true, '["admin", "pastor", "staff", "volunteer"]'),
('prayer_assigned', 'in_app', true, '["admin", "pastor", "staff", "volunteer"]')
ON CONFLICT (notification_type_id, method) DO NOTHING;

-- Success message
SELECT 'Prayer assignment notification type added successfully' AS message; 