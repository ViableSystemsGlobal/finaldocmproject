-- Make tenant_id and other constraints nullable for easier development
ALTER TABLE people.contacts 
ALTER COLUMN tenant_id DROP NOT NULL,
ALTER COLUMN lifecycle DROP NOT NULL;

-- Remove unique constraints that might cause problems during development
ALTER TABLE people.contacts 
DROP CONSTRAINT IF EXISTS contacts_phone_key,
DROP CONSTRAINT IF EXISTS contacts_email_key;

-- Re-add them as conditionals (only apply uniqueness when not null)
ALTER TABLE people.contacts 
ADD CONSTRAINT contacts_phone_key UNIQUE (phone) DEFERRABLE INITIALLY DEFERRED,
ADD CONSTRAINT contacts_email_key UNIQUE (email) DEFERRABLE INITIALLY DEFERRED; 