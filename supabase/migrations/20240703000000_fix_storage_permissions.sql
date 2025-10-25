-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('uploadmedia', 'uploadmedia', true)
on conflict (id) do update set public = true;

-- Allow public access to objects in the uploadmedia bucket
create policy "Allow public access to uploadmedia objects"
on storage.objects for select
using (bucket_id = 'uploadmedia');

-- Allow authenticated users to insert into uploadmedia bucket
create policy "Allow authenticated users to upload media"
on storage.objects for insert
with check (bucket_id = 'uploadmedia' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own media objects
create policy "Allow authenticated users to update own media"
on storage.objects for update
using (bucket_id = 'uploadmedia' AND auth.role() = 'authenticated' AND (auth.uid() = owner));

-- Allow authenticated users to delete their own media objects
create policy "Allow authenticated users to delete own media"
on storage.objects for delete
using (bucket_id = 'uploadmedia' AND auth.role() = 'authenticated' AND (auth.uid() = owner)); 