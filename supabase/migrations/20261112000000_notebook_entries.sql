-- Replace the survey-like reflection and learning-note surface with one private notebook.
create table if not exists public.notebook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  planner_item_id uuid,
  entry_date date not null default current_date,
  title text not null default 'Untitled page' check (char_length(btrim(title)) between 1 and 120),
  content text not null default '' check (char_length(content) <= 10000),
  drawing_data text check (drawing_data is null or char_length(drawing_data) <= 2500000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint notebook_entries_owned_planner_item_fk
    foreign key (user_id, planner_item_id)
    references public.planner_items (user_id, id)
    on delete set null
);

alter table public.notebook_entries enable row level security;
create policy notebook_entries_select_own on public.notebook_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy notebook_entries_insert_own on public.notebook_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy notebook_entries_update_own on public.notebook_entries
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy notebook_entries_delete_own on public.notebook_entries
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.notebook_entries to authenticated;
revoke all on public.notebook_entries from anon;

-- Preserve existing records as notebook pages while leaving their original tables intact.
insert into public.notebook_entries (user_id, planner_item_id, entry_date, title, content, created_at, updated_at)
select user_id, planner_item_id, entry_date, 'Learning reflection',
  concat_ws(E'\n\n',
    'What went well', went_well,
    'What was difficult', difficult,
    'Review later', review_later,
    'Confidence', confidence::text || '/5'),
  created_at, created_at
from public.reflections
on conflict (user_id, id) do nothing;

insert into public.notebook_entries (user_id, planner_item_id, entry_date, title, content, created_at, updated_at)
select user_id, planner_item_id, entry_date, topic,
  concat_ws(E'\n\n',
    nullif(question, ''),
    nullif(follow_up, '')),
  created_at, updated_at
from public.learning_notes
on conflict (user_id, id) do nothing;

notify pgrst, 'reload schema';
