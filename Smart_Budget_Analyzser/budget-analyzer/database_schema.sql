-- Enable the uuid-ossp extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create the 'secrets' table
create table if not exists public.secrets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  secret text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- (Optional) Create an index for faster lookups by user_id
create index if not exists idx_secrets_user_id on public.secrets(user_id); 