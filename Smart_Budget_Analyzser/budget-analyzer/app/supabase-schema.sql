-- Supabase Database Schema for FYP: Budget & Transaction Modules
--
-- 1. Categories Table (default + user-added)
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade, -- null for default categories
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, name)
);

-- 2. Transactions Table (soft delete, category support)
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(id) on delete cascade,
  amount numeric(10,2) not null,
  date date not null,
  category_id uuid references categories(id) on delete set null,
  description text,
  notes text,
  is_deleted boolean default false, -- Soft delete flag
  deleted_at timestamp with time zone, -- When soft deleted
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Budgets Table (per category, per user, per period)
create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  amount numeric(10,2) not null,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, category_id, start_date, end_date)
);

-- 4. Goals Table (financial goals for users)
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(id) on delete cascade,
  name text not null,
  category text not null,
  target_amount numeric(10,2) not null,
  current_amount numeric(10,2) default 0,
  due_date date not null,
  due_time time default '09:00:00', -- Time for due date (HH:MM:SS format)
  goal_month text, -- Month for filtering (e.g., "January 2024")
  icon text default 'flag',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 0. Users Table (for linking Firebase Auth users)
create table if not exists users (
  id text primary key, -- Firebase localId
  email text not null unique,
  name text, -- User's display name
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Category Budget Limits Table (customizable limits per category per user)
create table if not exists category_budget_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(id) on delete cascade,
  category_name text not null,
  monthly_limit numeric(10,2) not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, category_name)
);

-- 4. Insert Default Categories (run once)
insert into categories (name) values
  ('Food'),
  ('Transport'),
  ('Education'),
  ('Extra'),
  ('Goal'),
  ('Income'); 