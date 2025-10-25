-- Fix RLS policies for discipleship groups only (contacts handled separately)

-- Fix discipleship groups RLS policies
DROP POLICY IF EXISTS "Discipleship groups are manageable by admins" ON public.discipleship_groups;
DROP POLICY IF EXISTS "Discipleship groups are viewable by everyone" ON public.discipleship_groups;

CREATE POLICY "Allow all operations on discipleship groups" ON public.discipleship_groups
  FOR ALL USING (true);

-- Fix discipleship memberships RLS policies  
DROP POLICY IF EXISTS "Discipleship memberships are manageable by admins" ON public.discipleship_memberships;
DROP POLICY IF EXISTS "Discipleship memberships are viewable by everyone" ON public.discipleship_memberships;

CREATE POLICY "Allow all operations on discipleship memberships" ON public.discipleship_memberships
  FOR ALL USING (true); 