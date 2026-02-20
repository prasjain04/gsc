-- ═══════════════════════════════════════════════════════════
-- Girls Supper Club — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text default '',
  avatar_url text,
  dietary_restrictions text[] default '{}',
  role text default 'member' check (role in ('super_admin', 'admin', 'member')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, '', 'member')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── EVENTS ─────────────────────────────────────────────

create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text default '',
  volume_number integer not null default 1,
  date date not null,
  cookbook_id uuid,
  color_theme text, -- JSON string of color overrides
  lock_time timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── COOKBOOKS ──────────────────────────────────────────

create table public.cookbooks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  cover_url text,
  event_id uuid references public.events on delete cascade,
  created_at timestamptz default now()
);

-- Add foreign key back to events
alter table public.events
  add constraint events_cookbook_id_fkey
  foreign key (cookbook_id) references public.cookbooks(id);

-- ─── RECIPES ────────────────────────────────────────────

create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  cookbook_id uuid references public.cookbooks on delete cascade not null,
  name text not null,
  page_number integer,
  course text not null check (course in ('appetizer', 'main', 'side', 'dessert')),
  allergens text[] default '{}',
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  created_at timestamptz default now()
);

-- ─── RSVPs ──────────────────────────────────────────────

create table public.rsvps (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  status text not null check (status in ('attending', 'declined')),
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- ─── CLAIMS ─────────────────────────────────────────────

create table public.claims (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events on delete cascade not null,
  recipe_id uuid references public.recipes on delete cascade,
  user_id uuid references public.profiles on delete cascade not null,
  is_suggestion boolean default false,
  suggestion_name text,
  suggestion_course text check (suggestion_course is null or suggestion_course in ('appetizer', 'main', 'side', 'dessert')),
  suggestion_allergens text[] default '{}',
  suggestion_is_vegetarian boolean default false,
  created_at timestamptz default now()
);

-- Unique constraint: one claim per user per event (for non-suggestions linked to recipes)
create unique index claims_unique_recipe on public.claims (event_id, recipe_id) where recipe_id is not null;
create unique index claims_unique_user on public.claims (event_id, user_id);


-- ═══════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.cookbooks enable row level security;
alter table public.recipes enable row level security;
alter table public.rsvps enable row level security;
alter table public.claims enable row level security;

-- PROFILES: anyone can read, users can update their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- EVENTS: anyone authenticated can read, admins can write
create policy "Events are viewable by authenticated users"
  on public.events for select
  to authenticated
  using (true);

create policy "Events are viewable by anonymous users (for landing page)"
  on public.events for select
  to anon
  using (is_active = true);

create policy "Admins can manage events"
  on public.events for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('super_admin', 'admin')
    )
  );

-- COOKBOOKS: same as events
create policy "Cookbooks are viewable by all"
  on public.cookbooks for select
  using (true);

create policy "Admins can manage cookbooks"
  on public.cookbooks for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('super_admin', 'admin')
    )
  );

-- RECIPES: anyone can read, admins can write
create policy "Recipes are viewable by all"
  on public.recipes for select
  using (true);

create policy "Admins can manage recipes"
  on public.recipes for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('super_admin', 'admin')
    )
  );

-- RSVPs: anyone authenticated can read, users manage their own
create policy "RSVPs are viewable by authenticated users"
  on public.rsvps for select
  to authenticated
  using (true);

create policy "Users can manage their own RSVPs"
  on public.rsvps for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own RSVPs"
  on public.rsvps for update
  to authenticated
  using (auth.uid() = user_id);

-- Allow anon to insert RSVPs (for pre-signup RSVP flow)
create policy "Anon can insert RSVPs"
  on public.rsvps for insert
  to anon
  with check (true);

-- CLAIMS: anyone authenticated can read, users manage their own
create policy "Claims are viewable by authenticated users"
  on public.claims for select
  to authenticated
  using (true);

create policy "Users can insert their own claims"
  on public.claims for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own claims"
  on public.claims for delete
  to authenticated
  using (auth.uid() = user_id);

-- Admins can manage all claims
create policy "Admins can manage all claims"
  on public.claims for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('super_admin', 'admin')
    )
  );


-- ═══════════════════════════════════════════════════════════
-- Storage Buckets (create these in Supabase Dashboard → Storage)
-- ═══════════════════════════════════════════════════════════

-- Bucket: avatars (public)
-- Bucket: cookbook-covers (public)
--
-- For each bucket, set these policies in the dashboard:
--   SELECT: Allow authenticated users
--   INSERT: Allow authenticated users
--   UPDATE: Allow authenticated users (for own files)
--   DELETE: Allow authenticated users (for own files)
