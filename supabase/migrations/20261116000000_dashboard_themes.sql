alter table public.dashboard_settings
  add column if not exists theme text not null default 'light';

alter table public.dashboard_settings
  add column if not exists custom_primary text not null default '#2563eb';

alter table public.dashboard_settings
  add column if not exists custom_sidebar text not null default '';
alter table public.dashboard_settings
  add column if not exists custom_background text not null default '';

alter table public.dashboard_settings
  drop constraint if exists dashboard_settings_theme_check;
alter table public.dashboard_settings
  add constraint dashboard_settings_theme_check
  check (theme in ('light', 'dark', 'ocean', 'minimalist', 'high-contrast'));

alter table public.dashboard_settings
  drop constraint if exists dashboard_settings_custom_primary_check;
alter table public.dashboard_settings
  add constraint dashboard_settings_custom_primary_check
  check (custom_primary ~ '^#[0-9A-Fa-f]{6}$');

alter table public.dashboard_settings
  add constraint dashboard_settings_custom_sidebar_check
  check (custom_sidebar = '' or custom_sidebar ~ '^#[0-9A-Fa-f]{6}$');
alter table public.dashboard_settings
  add constraint dashboard_settings_custom_background_check
  check (custom_background = '' or custom_background ~ '^#[0-9A-Fa-f]{6}$');

notify pgrst, 'reload schema';
