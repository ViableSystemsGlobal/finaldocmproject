-- First try to drop policies that might be blocking our changes
DROP POLICY IF EXISTS "Allow all authenticated users to read" ON public.pages;
DROP POLICY IF EXISTS "Allow all authenticated users to modify during development" ON public.pages;
DROP POLICY IF EXISTS "Allow all authenticated users to read sections" ON public.page_sections;
DROP POLICY IF EXISTS "Allow all authenticated users to modify sections during development" ON public.page_sections;
DROP POLICY IF EXISTS "Allow all authenticated users to read media" ON public.media_library;
DROP POLICY IF EXISTS "Allow all authenticated users to modify media during development" ON public.media_library;

-- Now also drop the original policies
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.pages;
DROP POLICY IF EXISTS "Allow write access for admins" ON public.pages;
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.page_sections;
DROP POLICY IF EXISTS "Allow write access for admins" ON public.page_sections;
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.media_library;
DROP POLICY IF EXISTS "Allow write access for admins" ON public.media_library;

-- Create new policies with unique names to avoid conflicts
CREATE POLICY "dev_policy_pages_read" 
  ON public.pages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "dev_policy_pages_write" 
  ON public.pages FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "dev_policy_sections_read" 
  ON public.page_sections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "dev_policy_sections_write" 
  ON public.page_sections FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "dev_policy_media_read" 
  ON public.media_library FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "dev_policy_media_write" 
  ON public.media_library FOR ALL
  USING (auth.role() = 'authenticated'); 