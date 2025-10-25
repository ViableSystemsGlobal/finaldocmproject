-- Drop any policies that might be using the wrong bucket name
drop policy if exists "Allow public access to uploadmedia objects" on storage.objects;
drop policy if exists "Allow authenticated users to upload media" on storage.objects;
drop policy if exists "Allow authenticated users to update own media" on storage.objects;
drop policy if exists "Allow authenticated users to delete own media" on storage.objects;

-- Delete and recreate the bucket to ensure it's lowercase
delete from storage.buckets where id ilike 'uploadmedia';

-- Create bucket with lowercase name
insert into storage.buckets (id, name, public)
values ('uploadmedia', 'uploadmedia', true);

-- Allow public access to objects (using lowercase bucket name)
create policy "public_access_uploadmedia"
on storage.objects for select
using (bucket_id = 'uploadmedia');

-- Allow authenticated users to insert (using lowercase bucket name and WITH CHECK)
create policy "auth_insert_uploadmedia"
on storage.objects for insert
with check (bucket_id = 'uploadmedia' AND auth.role() = 'authenticated');

-- Use simpler version of policies for update and delete during development
create policy "auth_update_uploadmedia"
on storage.objects for update
using (bucket_id = 'uploadmedia');

create policy "auth_delete_uploadmedia"
on storage.objects for delete
using (bucket_id = 'uploadmedia'); 