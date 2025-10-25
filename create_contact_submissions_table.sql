-- ============================================================================
-- CONTACT SUBMISSIONS TABLE
-- ============================================================================
-- This table stores contact submissions from the public website form
-- before they are approved and moved to the main contacts table
-- ============================================================================

-- Drop table if exists (for clean re-run)
DROP TABLE IF EXISTS public.contact_submissions CASCADE;

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Information (matching contacts table structure)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  location TEXT,
  occupation TEXT,
  
  -- Submission Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  
  -- Admin Review
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL,
  
  -- Indexes for performance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_tenant ON public.contact_submissions(tenant_id);
CREATE INDEX idx_contact_submissions_submitted_at ON public.contact_submissions(submitted_at DESC);
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to INSERT (submit form)
CREATE POLICY "Allow public to submit contact details"
ON public.contact_submissions FOR INSERT
TO anon
WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT (admin review)
CREATE POLICY "Allow authenticated users to view submissions"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow authenticated users to UPDATE (approve/reject)
CREATE POLICY "Allow authenticated users to update submissions"
ON public.contact_submissions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to DELETE (remove rejected)
CREATE POLICY "Allow authenticated users to delete submissions"
ON public.contact_submissions FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION update_contact_submissions_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on table
GRANT SELECT, INSERT ON public.contact_submissions TO anon;
GRANT ALL ON public.contact_submissions TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from public website pending admin approval';
COMMENT ON COLUMN public.contact_submissions.status IS 'Submission status: pending, approved, or rejected';
COMMENT ON COLUMN public.contact_submissions.reviewed_by IS 'Admin user who reviewed the submission';
COMMENT ON COLUMN public.contact_submissions.admin_notes IS 'Optional notes from admin during review';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ contact_submissions table created successfully!';
  RAISE NOTICE '📋 Table includes: contact fields, status tracking, admin review fields';
  RAISE NOTICE '🔒 RLS enabled: Public can INSERT, Authenticated can manage';
END $$;

