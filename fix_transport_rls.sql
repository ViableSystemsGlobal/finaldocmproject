-- Drop existing RLS policies for transport tables (they might be too restrictive)
DROP POLICY IF EXISTS "Transport users can view all transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Transport users can insert transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Transport users can update transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Transport users can delete transport requests" ON public.transport_requests;

-- Create new universal policies that allow all operations
CREATE POLICY "Allow all operations on transport_requests"
  ON public.transport_requests FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on drivers"
  ON public.drivers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on vehicles"
  ON public.vehicles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on transport_routes"
  ON public.transport_routes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: This is for development only and should be replaced with proper RLS policies in production
-- These policies essentially disable RLS by allowing everything, but keep RLS enabled 