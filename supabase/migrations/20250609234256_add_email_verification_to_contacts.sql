-- Add email verification fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS contacts_verification_token_idx 
ON public.contacts(email_verification_token);

-- Create index for verification expiry cleanup
CREATE INDEX IF NOT EXISTS contacts_verification_expires_idx 
ON public.contacts(email_verification_expires);

COMMENT ON COLUMN public.contacts.email_verified IS 'Whether the email address has been verified';
COMMENT ON COLUMN public.contacts.email_verification_token IS 'Token used for email verification';
COMMENT ON COLUMN public.contacts.email_verification_expires IS 'When the verification token expires';
COMMENT ON COLUMN public.contacts.email_verification_sent_at IS 'When the verification email was last sent'; 