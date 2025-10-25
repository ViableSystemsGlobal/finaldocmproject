-- ============================================================================
-- WORD OF THE YEAR / ANNUAL THEME TABLE
-- ============================================================================
-- Stores annual spiritual themes/focus words for the church
-- Only one theme should be active at a time
-- ============================================================================

-- Create annual_themes table
CREATE TABLE IF NOT EXISTS public.annual_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Theme Details
  year INTEGER NOT NULL,
  theme_word TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Related Content
  sermon_id UUID REFERENCES public.sermons(id) ON DELETE SET NULL,
  scripture_reference TEXT,
  background_image_url TEXT,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_year_per_tenant UNIQUE (tenant_id, year)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_annual_themes_active ON public.annual_themes(is_active) WHERE is_active = true;
CREATE INDEX idx_annual_themes_year ON public.annual_themes(year DESC);
CREATE INDEX idx_annual_themes_tenant ON public.annual_themes(tenant_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.annual_themes ENABLE ROW LEVEL SECURITY;

-- Allow public (website) to read active themes
CREATE POLICY "Allow public to view active themes"
ON public.annual_themes FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users to manage themes
CREATE POLICY "Allow authenticated users to manage themes"
ON public.annual_themes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_annual_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_annual_themes_updated_at
BEFORE UPDATE ON public.annual_themes
FOR EACH ROW
EXECUTE FUNCTION update_annual_themes_updated_at();

-- ============================================================================
-- TRIGGER: Ensure only one active theme per tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a theme to active, deactivate all others for this tenant
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

CREATE TRIGGER trigger_ensure_single_active_theme
BEFORE INSERT OR UPDATE ON public.annual_themes
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION ensure_single_active_theme();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.annual_themes TO anon;
GRANT ALL ON public.annual_themes TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.annual_themes IS 'Annual spiritual themes/focus words for the church';
COMMENT ON COLUMN public.annual_themes.theme_word IS 'The word or short phrase for the year (e.g., "Rest", "Faith", "Breakthrough")';
COMMENT ON COLUMN public.annual_themes.description IS 'Explanation of the theme and its significance';
COMMENT ON COLUMN public.annual_themes.sermon_id IS 'Optional link to related sermon series';
COMMENT ON COLUMN public.annual_themes.scripture_reference IS 'Key Bible verse for the theme (e.g., "Matthew 11:28-30")';
COMMENT ON COLUMN public.annual_themes.is_active IS 'Only one theme should be active at a time';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data:
/*
INSERT INTO public.annual_themes (
  year,
  theme_word,
  description,
  scripture_reference,
  is_active,
  tenant_id
) VALUES (
  2025,
  'Rest',
  'This year, God is calling us to find rest in Him, to pause from our striving and trust in His perfect goodness and faithfulness. In a world that never stops, we choose to rest in His presence.',
  'Matthew 11:28-30',
  true,
  (SELECT id FROM tenant_settings LIMIT 1)
);
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ annual_themes table created successfully!';
  RAISE NOTICE '📋 Features:';
  RAISE NOTICE '   - Store multiple years of themes';
  RAISE NOTICE '   - Only one active theme at a time';
  RAISE NOTICE '   - Link to sermon series';
  RAISE NOTICE '   - Public can view active theme';
  RAISE NOTICE '   - Background image support';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next: Create admin page at /settings/word-of-year';
END $$;

