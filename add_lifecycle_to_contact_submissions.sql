-- Add lifecycle column to contact_submissions table

ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS lifecycle TEXT DEFAULT 'visitor';

-- Add check constraint for valid lifecycle values
ALTER TABLE public.contact_submissions 
DROP CONSTRAINT IF EXISTS contact_submissions_lifecycle_check;

ALTER TABLE public.contact_submissions
ADD CONSTRAINT contact_submissions_lifecycle_check 
CHECK (lifecycle IN ('soul', 'contact', 'visitor', 'member', 'inactive'));

-- Update the approval function to use the submitted lifecycle
COMMENT ON COLUMN public.contact_submissions.lifecycle IS 'Contact lifecycle status: soul, contact, visitor, member, inactive';

SELECT 'Lifecycle column added successfully!' as status;

