-- Fix RLS policies for giving_categories table
-- This allows authenticated users to read and manage giving categories

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read giving_categories" ON public.giving_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage giving_categories" ON public.giving_categories;
DROP POLICY IF EXISTS "Service role can manage giving_categories" ON public.giving_categories;

-- Policy 1: Allow authenticated users to read giving categories
CREATE POLICY "Allow authenticated users to read giving_categories"
  ON public.giving_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Allow authenticated users to manage giving categories (for admin operations)
CREATE POLICY "Allow authenticated users to manage giving_categories"
  ON public.giving_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 3: Allow service role to do everything (for system operations)
CREATE POLICY "Service role can manage giving_categories"
  ON public.giving_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.giving_categories TO authenticated;
GRANT ALL ON public.giving_categories TO service_role; 