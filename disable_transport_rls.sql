-- Disable RLS for transport tables for development only
-- WARNING: This is NOT recommended for production environments

ALTER TABLE public.transport_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS, use:
-- ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY; 