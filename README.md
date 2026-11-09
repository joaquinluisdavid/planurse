# Planurse

A calm calendar and learning planner for nursing students and new graduate hospital RNs.
**Workflow and organization only—not clinical decision support or an official
medical record. Do not enter patient-identifying information.**

Planurse now has real Supabase sign-up/sign-in, password recovery, account
onboarding, and user-scoped cloud repositories. It no longer offers the local
fictional workspace as an application mode. **Production account isolation is
not verified until the migration is applied and the two-user RLS checks below
pass against your Supabase project.** No Supabase credentials are included in
this repository.

## Configure a Supabase project

1. Create a Supabase project and copy its Project URL and publishable key from
   the project API settings.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY`. Never use a `service_role` key in a Vite
   variable or browser bundle. `.env` is ignored by Git.
3. In the Supabase SQL editor, apply all three migrations in order:
   `supabase/migrations/20261109000000_initial_private_workspace.sql`, then
   `supabase/migrations/20261110000000_calendar_planning.sql`, then
   `supabase/migrations/20261111000000_cases_handled.sql`.
4. In Supabase Auth URL configuration, set the local site URL to
   `http://localhost:5173` and allow `http://localhost:5173/` and
   `http://localhost:5173/update-password` as redirect URLs. For GitHub Pages,
   set the Site URL to `https://joaquinluisdavid.github.io/planurse/` and allow
   both that exact URL and
   `https://joaquinluisdavid.github.io/planurse/update-password`. The sign-up
   confirmation callback is built from Vite's deployed base path, so it returns
   to `/planurse/`, not the repository root or localhost. Configure email
   confirmation and password policies appropriate for your project.
5. Run the app and create two separate accounts. Confirm the email if enabled,
   complete onboarding, and test the isolation checklist below before using real
   accounts. Use fictional/non-identifying work content only.

If sign-in returns PostgREST error `PGRST205` for `public.profiles`, the schema
is missing or its API cache is stale: apply all three migrations in order in the SQL
Editor, wait for them to finish, then reload the app. The initial migration
requests a PostgREST schema-cache refresh at the end.

```sh
npm ci
npm run dev
```

Without valid project environment values the app blocks account actions and
shows setup guidance; it does not fall back to local demo storage. A configured
project also needs the migration before profiles and workspace queries work.

## Features

- Supabase Auth sign-up, sign-in, email confirmation, sign-out, reset email, and
  password update.
- Authenticated profile onboarding (`student` / `new-rn`).
- Date-first monthly calendar with scheduled responsibilities, flexible
  reminders, completion, drag-to-reschedule, and a keyboard/mobile edit flow.
- Cases handled are logged from a selected calendar day using a broad work
  category and optional general takeaway; there is no separate case list or
  patient registry.
- Learning notes and personal reflections can be saved on any date, linked to a
  calendar entry or a cases-handled entry when useful, or optionally associated
  with a legacy shift.
- Existing shift/task history remains available, but starting a shift is not
  required to use the calendar, reminders, reflections, or learning notes.
- Handoff-draft authoring was removed to avoid duplicating standard handoff and
  Kardex workflows. Existing database handoff rows are not loaded by the app.
- Data-access boundary converts database snake_case to the app model and writes
  changed rows only; it never uploads/replaces a whole browser snapshot.
- RLS on profiles and workspace tables; composite owner/shift and
  owner/calendar-entry foreign keys prevent cross-account links.
- Responsive shell, accessible forms/dialogs, and workflow-only safety notices.

The app is not a hospital record system, HIPAA compliance certification, or
clinical decision-support product. Account data should not include patient
names, medical record numbers, diagnoses, dates of birth, addresses, or other
protected health information. Cases handled are broad categories such as care
coordination or patient education—not patient cases, names, diagnoses, room
numbers, or uniquely identifying scenarios. Calendar text, takeaways, notes, and
reflections must remain general and non-identifying; they are not clinical
documentation. Follow employer policy and approved clinical supervision/
references.

## Calendar and cases-handled migrations

The calendar migration adds account-owned calendar entries, permits date-only
reflections/learning notes, links them optionally to calendar items, and
normalizes old sample-prefixed room labels. The cases-handled migration stores
only a fixed broad category, date, optional calendar link, and optional general
learning takeaway. It deliberately has no patient name, patient ID, room, case
narrative, diagnosis, or clinical documentation fields. Notes/reflections may
link to the case entry, with same-owner and same-date checks.
The legacy handoff table/data are retained in the database for now, but are no
longer queried or exposed by the app. No destructive data drop is performed.

## Required security verification before production

The migration defines owner-scoped SELECT/INSERT/UPDATE/DELETE policies and
composite foreign keys. These are implementation claims, not a result of a live
security audit. Verify with two distinct confirmed users and the publishable key
(the service-role key bypasses RLS):

- User A can create/read/update/delete their profile and workspace records.
- User B cannot select, update, or delete A's records, even with A's UUIDs.
- B cannot insert a child record that references A's shift ID.
- Anonymous requests cannot access any profile or workspace rows.
- Two simultaneous active-shift inserts for one user cannot both succeed.
- Password-reset links work only on configured HTTPS origins in production.

Do not launch or promise private multi-user storage until those checks pass on the
actual Supabase project. Database RLS is the security boundary; frontend route
guards and user ID filters are defense in depth only. Never expose a service-role
key to the browser.

## Commands and project requirements

Use Node 24 LTS or supported Node 22.13+ and npm.

```sh
npm run dev
npm test
npm run build
npm run lint
npm run format:check
```

The UI test suite uses injected auth and workspace repositories and does not
contact Supabase. It does not replace the two-user live RLS checks above. The
cases-handled log stores only its selected category and optional general
takeaway, with no fields for patient identity or a case narrative.

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow at
`.github/workflows/deploy-pages.yml`. It runs tests, builds the Vite SPA with
the `/planurse/` repository base path, adds a `404.html` fallback for direct
React Router URLs, and deploys `dist` to Pages.

1. In GitHub, open **joaquinluisdavid/planurse → Settings → Pages** and set the
   build/deployment source to **GitHub Actions**.
2. Open **Settings → Secrets and variables → Actions → Variables** and add the
   repository variables `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY`. These are public client values embedded in
   the site bundle; never use a Supabase `service_role` or secret key here.
   Local `.env` values are not used by a GitHub Actions deployment.
3. Push to `main` (or manually run **Deploy Planurse to GitHub Pages** from the
   Actions tab). The deployment URL is
   `https://joaquinluisdavid.github.io/planurse/`.
4. In Supabase Auth URL Configuration, set the Site URL to
   `https://joaquinluisdavid.github.io/planurse/` and add that URL plus
   `https://joaquinluisdavid.github.io/planurse/update-password` to the allowed
   redirect URLs. Keep the local development URLs too if needed.
5. Apply all three database migrations in order and verify two-user RLS
   isolation before using account data. Direct nested routes use the workflow's `404.html` SPA
   fallback. The `public/_redirects` file is for Netlify, not GitHub Pages.

Do not market the service as HIPAA compliant or use it for patient records
based solely on these technical controls.
