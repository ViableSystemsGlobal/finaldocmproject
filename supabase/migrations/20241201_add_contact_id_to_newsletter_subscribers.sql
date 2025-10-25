-- Add contact_id column to newsletter_subscribers table to link back to contacts
ALTER TABLE newsletter_subscribers 
ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_contact_id ON newsletter_subscribers(contact_id);

-- Update the existing newsletter_subscribers to link them to contacts where possible
UPDATE newsletter_subscribers 
SET contact_id = contacts.id
FROM contacts
WHERE newsletter_subscribers.email = contacts.email
AND newsletter_subscribers.contact_id IS NULL; 