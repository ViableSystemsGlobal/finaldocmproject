-- Create event-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Setup more permissive policies for the event-images bucket
DROP POLICY IF EXISTS "Allow public access to event-images bucket" ON storage.objects;
CREATE POLICY "Allow public access to event-images bucket" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Allow inserting objects into event-images bucket" ON storage.objects;
CREATE POLICY "Allow inserting objects into event-images bucket" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Allow updating event-images bucket objects" ON storage.objects;
CREATE POLICY "Allow updating event-images bucket objects" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Allow deleting from event-images bucket" ON storage.objects;
CREATE POLICY "Allow deleting from event-images bucket" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'event-images');

-- Grant all privileges on storage objects
GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON storage.buckets TO authenticated, anon, service_role; 