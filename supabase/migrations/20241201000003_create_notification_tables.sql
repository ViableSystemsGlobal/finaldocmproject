-- Create notification system tables
-- This migration creates all the tables needed for the notification system to work

-- Global notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    test_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default global settings
INSERT INTO public.notification_settings (email_enabled, sms_enabled, push_enabled, in_app_enabled, test_mode)
VALUES (true, false, true, true, false)
ON CONFLICT DO NOTHING;

-- User profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type_id TEXT NOT NULL,
    method TEXT NOT NULL, -- 'email', 'sms', 'push', 'in_app'
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type_id, method)
);

-- Notification logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_settings (admin only)
CREATE POLICY "notification_settings_select_policy" ON public.notification_settings
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "notification_settings_update_policy" ON public.notification_settings
FOR UPDATE TO authenticated
USING (true);

-- RLS Policies for user_profiles
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for user_notification_preferences
CREATE POLICY "user_notification_preferences_select_policy" ON public.user_notification_preferences
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_notification_preferences_insert_policy" ON public.user_notification_preferences
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_notification_preferences_update_policy" ON public.user_notification_preferences
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for notification_logs
CREATE POLICY "notification_logs_select_policy" ON public.notification_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "notification_logs_insert_policy" ON public.notification_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notification_preferences TO authenticated;
GRANT SELECT, INSERT ON public.notification_logs TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON public.notification_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON public.user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.notification_settings IS 'Global notification system settings';
COMMENT ON TABLE public.user_profiles IS 'User profile information including roles';
COMMENT ON TABLE public.user_notification_preferences IS 'Individual user notification preferences';
COMMENT ON TABLE public.notification_logs IS 'Log of all notifications sent';

-- Test data: Insert some sample user profiles for testing
-- This will help with testing the notification system
INSERT INTO public.user_profiles (user_id, email, first_name, last_name, role)
SELECT 
    id as user_id, 
    email, 
    COALESCE(raw_user_meta_data->>'first_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    'admin' as role
FROM auth.users 
WHERE email IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    updated_at = NOW();

-- Success message
SELECT 'Notification system tables created successfully' AS message; 