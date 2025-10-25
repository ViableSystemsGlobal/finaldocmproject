-- Fix RLS policies to allow data insertion and management

-- Drop existing restrictive policies and create more permissive ones for development

-- Groups table policies
DROP POLICY IF EXISTS "Groups are manageable by admins" ON public.groups;
DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.groups;

CREATE POLICY "Allow all operations on groups" ON public.groups
  FOR ALL USING (true);

-- Group memberships policies  
DROP POLICY IF EXISTS "Group memberships are manageable by admins" ON public.group_memberships;
DROP POLICY IF EXISTS "Group memberships are viewable by everyone" ON public.group_memberships;

CREATE POLICY "Allow all operations on group memberships" ON public.group_memberships
  FOR ALL USING (true);

-- Members table policies
DROP POLICY IF EXISTS "Members are manageable by admins" ON public.members;
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.members;

CREATE POLICY "Allow all operations on members" ON public.members
  FOR ALL USING (true);

-- Mobile app users policies
DROP POLICY IF EXISTS "App users are manageable by admins" ON public.mobile_app_users;
DROP POLICY IF EXISTS "App users are viewable by everyone" ON public.mobile_app_users;

CREATE POLICY "Allow all operations on mobile app users" ON public.mobile_app_users
  FOR ALL USING (true); 