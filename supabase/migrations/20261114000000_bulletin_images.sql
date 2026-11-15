alter table public.bulletin_posts
  add column if not exists image_url text not null default ''
  check (char_length(image_url) <= 2000);

notify pgrst, 'reload schema';
