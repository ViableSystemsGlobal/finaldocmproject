-- Disable RLS for development only (NOT recommended for production)
ALTER TABLE public.pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library DISABLE ROW LEVEL SECURITY;

-- To re-enable later, use:
-- ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY; 