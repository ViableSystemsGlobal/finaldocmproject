-- Simple Word of the Year table - NO COMPLEX CONSTRAINTS

CREATE TABLE IF NOT EXISTS public.annual_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  theme_word TEXT NOT NULL,
  description TEXT NOT NULL,
  sermon_id UUID,
  scripture_reference TEXT,
  background_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_annual_themes_active ON public.annual_themes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_annual_themes_year ON public.annual_themes(year DESC);

-- RLS
ALTER TABLE public.annual_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to view active themes" ON public.annual_themes;
CREATE POLICY "Allow public to view active themes"
ON public.annual_themes FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Allow authenticated users to manage themes" ON public.annual_themes;
CREATE POLICY "Allow authenticated users to manage themes"
ON public.annual_themes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_annual_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_annual_themes_updated_at ON public.annual_themes;
CREATE TRIGGER trigger_update_annual_themes_updated_at
BEFORE UPDATE ON public.annual_themes
FOR EACH ROW
EXECUTE FUNCTION update_annual_themes_updated_at();

-- Trigger to ensure only one active theme
CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.annual_themes
    SET is_active = false
    WHERE tenant_id = NEW.tenant_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_active_theme ON public.annual_themes;
CREATE TRIGGER trigger_ensure_single_active_theme
BEFORE INSERT OR UPDATE ON public.annual_themes
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION ensure_single_active_theme();

-- Permissions
GRANT SELECT ON public.annual_themes TO anon;
GRANT ALL ON public.annual_themes TO authenticated;

SELECT 'Word of the Year table created successfully!' as status;

