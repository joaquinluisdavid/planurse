-- Private, account-scoped Planurse workspace. Apply with Supabase CLI or SQL editor.
-- No service-role credentials are used by the browser app.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'new-rn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('day', 'evening', 'night')),
  date date not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  patient_labels text[] not null default '{}',
  unique (user_id, id)
);
create unique index if not exists shifts_one_active_per_user
  on public.shifts (user_id) where ended_at is null;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shift_id uuid not null,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  patient_label text not null default '',
  priority text not null check (priority in ('routine', 'important', 'urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, id),
  constraint tasks_owned_shift_fk foreign key (user_id, shift_id)
    references public.shifts (user_id, id) on delete cascade
);

create table if not exists public.handoffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shift_id uuid not null,
  patient_label text not null,
  situation text not null check (char_length(situation) <= 2000),
  background text not null check (char_length(background) <= 2000),
  assessment text not null check (char_length(assessment) <= 2000),
  recommendation text not null check (char_length(recommendation) <= 2000),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint handoffs_owned_shift_fk foreign key (user_id, shift_id)
    references public.shifts (user_id, id) on delete cascade
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shift_id uuid not null,
  went_well text not null check (char_length(went_well) <= 2000),
  difficult text not null check (char_length(difficult) <= 2000),
  review_later text not null check (char_length(review_later) <= 2000),
  confidence integer not null check (confidence between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, id),
  constraint reflections_owned_shift_fk foreign key (user_id, shift_id)
    references public.shifts (user_id, id) on delete cascade
);

create table if not exists public.learning_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shift_id uuid not null,
  topic text not null check (char_length(btrim(topic)) between 3 and 100),
  question text not null default '' check (char_length(question) <= 1000),
  follow_up text not null default '' check (char_length(follow_up) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint learning_notes_owned_shift_fk foreign key (user_id, shift_id)
    references public.shifts (user_id, id) on delete cascade
);

alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.tasks enable row level security;
alter table public.handoffs enable row level security;
alter table public.reflections enable row level security;
alter table public.learning_notes enable row level security;

-- Restrict every browser operation to the signed-in owner. RLS is the security
-- boundary; client-side route guards and user_id filters are only defense in depth.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'shifts', 'tasks', 'handoffs', 'reflections', 'learning_notes'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      table_name || '_insert_own', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      table_name || '_update_own', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      table_name || '_delete_own', table_name
    );
  end loop;
end
$$;

grant select, insert, update, delete on public.profiles, public.shifts,
  public.tasks, public.handoffs, public.reflections, public.learning_notes
  to authenticated;
revoke all on public.profiles, public.shifts, public.tasks, public.handoffs,
  public.reflections, public.learning_notes from anon;

notify pgrst, 'reload schema';
