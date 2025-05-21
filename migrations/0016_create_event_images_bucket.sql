-- Create event-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO 
  UPDATE SET public = true;

-- Create permissive policies for the event-images bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload event images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload event images"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Allow users to select event images" ON storage.objects;
CREATE POLICY "Allow users to select event images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Allow owners to update and delete event images" ON storage.objects;
CREATE POLICY "Allow owners to update and delete event images"
ON storage.objects
FOR ALL
TO authenticated, anon
USING (bucket_id = 'event-images');

-- Grant all privileges to storage objects 
GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role; 