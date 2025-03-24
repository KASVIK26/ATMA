-- Drop existing policies if they exist
drop policy if exists "Universities are viewable by authenticated users" on universities;
drop policy if exists "Universities are insertable by authenticated users" on universities;

-- Create universities table if it doesn't exist
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.universities enable row level security;

-- Create policies
create policy "Universities are viewable by authenticated users"
on universities for select
to authenticated
using (true);

create policy "Universities are insertable by authenticated users"
on universities for insert
to authenticated
with check (true);

-- Drop existing trigger if it exists
drop trigger if exists handle_universities_updated_at on universities;

-- Create or replace function to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger to update updated_at
create trigger handle_universities_updated_at
  before update on public.universities
  for each row
  execute function public.handle_updated_at(); 