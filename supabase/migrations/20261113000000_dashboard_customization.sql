-- Private Overview customization: a cover image URL and a small bulletin board.
create table if not exists public.dashboard_settings (
  id uuid primary key references auth.users (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  cover_image_url text not null default '',
  theme text not null default 'light' check (theme in ('light', 'dark', 'ocean', 'minimalist', 'high-contrast')),
  custom_primary text not null default '#2563eb' check (custom_primary ~ '^#[0-9A-Fa-f]{6}$'),
  custom_accent text not null default '#f97316' check (custom_accent ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now(),
  check (char_length(cover_image_url) <= 2000)
);

create table if not exists public.bulletin_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  content text not null check (char_length(btrim(content)) between 1 and 500),
  color text not null default 'yellow' check (color in ('yellow', 'blue', 'pink', 'green')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

alter table public.dashboard_settings enable row level security;
alter table public.bulletin_posts enable row level security;

create policy dashboard_settings_select_own on public.dashboard_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy dashboard_settings_insert_own on public.dashboard_settings
  for insert to authenticated with check (user_id = (select auth.uid()) and id = (select auth.uid()));
create policy dashboard_settings_update_own on public.dashboard_settings
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and id = (select auth.uid()));
create policy bulletin_posts_select_own on public.bulletin_posts
  for select to authenticated using (user_id = (select auth.uid()));
create policy bulletin_posts_insert_own on public.bulletin_posts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy bulletin_posts_update_own on public.bulletin_posts
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy bulletin_posts_delete_own on public.bulletin_posts
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.dashboard_settings, public.bulletin_posts to authenticated;
revoke all on public.dashboard_settings, public.bulletin_posts from anon;
notify pgrst, 'reload schema';
