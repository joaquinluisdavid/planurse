-- Extend the account profile with personal display details and a private avatar.
-- Role describes the account audience; position is the person's current job title.

alter table public.profiles
  drop constraint if exists profiles_role_check;
update public.profiles set role = 'registered-nurse' where role = 'new-rn';
update public.profiles set role = 'student-nurse' where role = 'student';
alter table public.profiles
  add constraint profiles_role_check check (role in ('student-nurse', 'registered-nurse'));

alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists nickname text not null default '',
  add column if not exists position text not null default '',
  add column if not exists avatar_path text;

alter table public.profiles
  add constraint profiles_first_name_length check (char_length(btrim(first_name)) <= 80),
  add constraint profiles_last_name_length check (char_length(btrim(last_name)) <= 80),
  add constraint profiles_nickname_length check (char_length(btrim(nickname)) <= 60),
  add constraint profiles_position_length check (char_length(btrim(position)) <= 100);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy profile_avatars_read_own on storage.objects
  for select to authenticated using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy profile_avatars_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy profile_avatars_update_own on storage.objects
  for update to authenticated using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy profile_avatars_delete_own on storage.objects
  for delete to authenticated using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

notify pgrst, 'reload schema';
