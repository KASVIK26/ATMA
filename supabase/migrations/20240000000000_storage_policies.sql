-- Create storage buckets if they don't exist
insert into storage.buckets (id, name)
values ('timetables', 'timetables')
on conflict (id) do nothing;

insert into storage.buckets (id, name)
values ('enrollments', 'enrollments')
on conflict (id) do nothing;

-- Enable RLS on the buckets table
alter table storage.buckets enable row level security;

-- Create policies for timetables bucket
create policy "Authenticated users can upload timetables"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'timetables'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can view timetables"
on storage.objects for select
to authenticated
using (
  bucket_id = 'timetables'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can update their timetables"
on storage.objects for update
to authenticated
using (
  bucket_id = 'timetables'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can delete their timetables"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'timetables'
  and auth.role() = 'authenticated'
);

-- Create policies for enrollments bucket
create policy "Authenticated users can upload enrollments"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'enrollments'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can view enrollments"
on storage.objects for select
to authenticated
using (
  bucket_id = 'enrollments'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can update their enrollments"
on storage.objects for update
to authenticated
using (
  bucket_id = 'enrollments'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can delete their enrollments"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'enrollments'
  and auth.role() = 'authenticated'
); 