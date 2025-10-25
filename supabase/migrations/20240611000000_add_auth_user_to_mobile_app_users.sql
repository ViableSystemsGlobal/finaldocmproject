-- Add auth_user_id field to mobile_app_users table to link with Supabase auth
ALTER TABLE public.mobile_app_users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance on auth_user_id lookups
CREATE INDEX IF NOT EXISTS mobile_app_users_auth_user_id_idx ON public.mobile_app_users(auth_user_id);

-- Create unique constraint to ensure one record per auth user
ALTER TABLE public.mobile_app_users 
ADD CONSTRAINT mobile_app_users_auth_user_id_unique UNIQUE (auth_user_id); 