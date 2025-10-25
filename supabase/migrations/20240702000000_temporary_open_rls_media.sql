-- Temporarily drop the current media_library RLS policies for development
drop policy if exists "Allow all authenticated users to read media" on public.media_library;
drop policy if exists "Allow all authenticated users to modify media during development" on public.media_library;

-- Create a more permissive policy for development
create policy "Allow anyone to read media during development"
  on public.media_library for select
  using (true);

-- Create separate policies for each operation with the correct syntax
create policy "Allow anyone to insert media during development"
  on public.media_library for insert
  with check (true);

create policy "Allow anyone to update media during development"
  on public.media_library for update
  using (true);

create policy "Allow anyone to delete media during development"
  on public.media_library for delete
  using (true);

-- Comment: This is a temporary policy for development purposes.
-- Before moving to production, replace with proper authenticated policies. 