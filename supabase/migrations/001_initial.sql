-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Routines table: stores the entire routine as a JSONB items array
-- to avoid complex relational joins for this shape of data.
create table if not exists public.routines (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  items       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists routines_user_id_idx on public.routines(user_id);

-- Row-level security: users can only access their own routines
alter table public.routines enable row level security;

create policy "Users can view own routines"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Users can insert own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Users can delete own routines"
  on public.routines for delete
  using (auth.uid() = user_id);
