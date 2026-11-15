-- Imported dashboard images are stored as bounded data URLs for private, owner-scoped use.
alter table public.dashboard_settings
  drop constraint if exists dashboard_settings_cover_image_url_check;
alter table public.dashboard_settings
  add constraint dashboard_settings_cover_image_url_check
  check (char_length(cover_image_url) <= 2800000);

alter table public.bulletin_posts
  drop constraint if exists bulletin_posts_image_url_check;
alter table public.bulletin_posts
  add constraint bulletin_posts_image_url_check
  check (char_length(image_url) <= 2800000);

notify pgrst, 'reload schema';
