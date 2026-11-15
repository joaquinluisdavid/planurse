-- Date-first personal planning replaces a mandatory shift-start workflow.
-- Existing shift/task history is retained; handoff records remain untouched but
-- are no longer fetched or exposed by the application.

create table if not exists public.planner_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  kind text not null check (kind in ('schedule', 'reminder')),
  date date not null,
  start_time time,
  end_time time,
  notes text not null default '' check (char_length(notes) <= 2000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (kind <> 'schedule' or start_time is not null),
  check (end_time is null or start_time is not null),
  check (end_time is null or end_time > start_time)
);

alter table public.reflections alter column shift_id drop not null;
alter table public.reflections add column if not exists entry_date date;
alter table public.reflections add column if not exists planner_item_id uuid;
update public.reflections r set entry_date = s.date
  from public.shifts s where r.entry_date is null and r.shift_id = s.id and r.user_id = s.user_id;
update public.reflections set entry_date = current_date where entry_date is null;
alter table public.reflections alter column entry_date set not null;
alter table public.reflections alter column entry_date set default current_date;
alter table public.reflections add constraint reflections_owned_planner_item_fk
  foreign key (user_id, planner_item_id)
  references public.planner_items (user_id, id)
  on delete set null (planner_item_id);

alter table public.learning_notes alter column shift_id drop not null;
alter table public.learning_notes add column if not exists entry_date date;
alter table public.learning_notes add column if not exists planner_item_id uuid;
update public.learning_notes n set entry_date = s.date
  from public.shifts s where n.entry_date is null and n.shift_id = s.id and n.user_id = s.user_id;
update public.learning_notes set entry_date = current_date where entry_date is null;
alter table public.learning_notes alter column entry_date set not null;
alter table public.learning_notes alter column entry_date set default current_date;
alter table public.learning_notes add constraint learning_notes_owned_planner_item_fk
  foreign key (user_id, planner_item_id)
  references public.planner_items (user_id, id)
  on delete set null (planner_item_id);

alter table public.planner_items enable row level security;
create policy planner_items_select_own on public.planner_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy planner_items_insert_own on public.planner_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy planner_items_update_own on public.planner_items
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy planner_items_delete_own on public.planner_items
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.planner_items to authenticated;
revoke all on public.planner_items from anon;

-- Normalize historical sample labels to the current room shorthand format.
update public.shifts
set patient_labels = array(
  select regexp_replace(label, '^Demo[[:space:]]+', 'Room ', 'i')
  from unnest(patient_labels) as label
);
update public.tasks set patient_label = regexp_replace(patient_label, '^Demo[[:space:]]+', 'Room ', 'i')
  where patient_label ~* '^Demo[[:space:]]+';
update public.handoffs set patient_label = regexp_replace(patient_label, '^Demo[[:space:]]+', 'Room ', 'i')
  where patient_label ~* '^Demo[[:space:]]+';

notify pgrst, 'reload schema';
