# Planurse

A calm shift organizer for nursing students and new graduate hospital RNs.
**Workflow and organization only, not clinical decision support.**

## Current release: stages 1–4

This is the requested **mock-first foundation**, not the finished ten-stage MVP.
Stages 1, 2, 3, and 4 each passed a production build during implementation.

| Stage                                                    | Status                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| 1. React, TypeScript, Vite, Tailwind, shadcn/ui, routing | Complete                                                          |
| 2. Responsive shell, desktop sidebar, mobile navigation  | Complete                                                          |
| 3. Dashboard with fictional data                         | Complete                                                          |
| 4. Shift planner with fictional data                     | Complete                                                          |
| 5. Supabase authentication and account onboarding        | Next                                                              |
| 6. PostgreSQL persistence, migrations, RLS               | Not connected                                                     |
| 7. SBAR draft create/edit/delete/copy/print              | Read-only samples only                                            |
| 8. Reflections and learning notes                        | Reflection samples; editors deferred                              |
| 9. Tests, accessibility, responsive refinements          | Initial coverage included; expand with later stages               |
| 10. Deployment                                           | Static demo instructions below; production account setup deferred |

### What works

- Select a demo perspective: nursing student or new graduate RN.
- Dashboard: current shift, date/type, task counts, overdue tasks, upcoming due
  dates, fictional handoff/reflection previews, and quick actions.
- Start day, evening, or night shifts; only one shift may be active.
- Add fictional room codes and general workflow tasks.
- Create, edit, delete, complete, and reopen tasks.
- Routine, important, and urgent organizational priorities, plus optional due
  dates and local times (including the next date for overnight work).
- Combine room, priority, completion, and due-time filters.
- Active tasks are shown by default during a shift; ended shifts show all tasks.
  Clear filters shows all tasks.
- Overdue tasks sort first; the next-hour filter means the next 60 minutes.
- End shifts with acknowledgement of unfinished tasks. History becomes
  read-only; ending a shift never completes its tasks automatically.
- Loading, empty, validation, error, and success states.
- Reset local fictional data in Settings.

### Honest demo boundaries

**Demo entry is not authentication.** `/login` and `/signup` explain the current
status instead of collecting credentials. `/onboarding` selects a demo
perspective, not an account profile. `DemoGate` redirects visitors who have not
entered the demo; it does not enforce security.

Demo entry is stored in `sessionStorage`. Fictional workspace data is validated
with Zod and stored in `localStorage`, so edits survive reloads. Users of the same
browser profile share the same demo data. Exiting the demo does not erase it.
Multiple tabs receive storage-change updates, but the demo is not a transactional
multi-user database. Use one tab for editing; concurrent cross-tab writes can be
last-write-wins. Browser storage is neither secure storage nor a backup.

No Supabase SDK, database queries, migration SQL, or RLS is wired yet. Do not
interpret the demo owner identifier or client-side validation as authorization.
The future user-isolation acceptance check is **not satisfied by this demo**.

## Privacy and safety

Use fictional data only. Never enter real patient names, medical record numbers,
diagnoses, addresses, dates of birth, or other protected health information.
Room fields accept fictional codes and automatically prefix them with
`Demo room`; this does not make real room information safe to enter. Free-text
fields cannot automatically guarantee that information is non-identifying.

Planurse does not replace hospital policy, clinical judgment, supervision, or
approved clinical references. It provides no diagnosis, treatment,
medication-dosing, or emergency medical advice. SBAR content is labeled as a
**preparation aid, not an official medical record**. Learning content is general
and fictional; no clinical answers are generated.

## Run locally

Use Node **24 LTS** (or supported Node 22.13+), and npm. The scaffold's newest
TypeScript release was incompatible with the ESLint TypeScript parser, so this
project deliberately uses TypeScript 5.9 with strict checking.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Choose **Explore the demo**, select a perspective,
and open the fictional workspace.

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` and `npx.cmd` instead:

```powershell
npm.cmd ci
npm.cmd run dev
```

No environment variables or live Supabase project are needed. `.env.example`
reserves the public URL and publishable key for stages 5–6. Never put a Supabase
service-role key in any `VITE_` variable: Vite exposes those values to browsers.
Environment files are ignored except for `.env.example`.

```sh
npm run build         # TypeScript project checks + optimized Vite build
npm run preview       # Serve the built dist directory locally
npm test              # Vitest + React Testing Library, no live backend
npm run test:watch
npm run lint          # ESLint + TypeScript and React hooks rules
npm run format
npm run format:check
```

The lockfile is committed for reproducible installs. If an old npm resolver
fails with `edgesOut` on an initial dependency install, use a current npm
compatible with your Node version rather than `--force` or `--legacy-peer-deps`.

## Structure

```text
src/
  App.tsx                 Route definitions and providers
  main.tsx                React root, StrictMode, global styles
  components/             Shared shell, page headers, feedback and safety notice
    ui/                   Customized shadcn/Radix primitives
  pages/                  Small route-level components
  features/shifts/
    schemas.ts            Zod schemas + inferred form-value types
    mutations.ts          Pure shift/task business rules
    selectors.ts          Filtering, sorting and overdue logic
    TaskForm.tsx          React Hook Form editor
    TaskRow.tsx           Explicitly typed task presentation
    TaskFilterBar.tsx      Controlled filters
  data/
    models.ts             Validated demo entities and TypeScript types
    demoRepository.ts     Browser persistence, separate from visual components
    WorkspaceProvider.tsx Async loading and shared workspace state
    useWorkspace.ts       Context access hook
  demo/
    fixtures.ts           Fictional examples generated relative to first load
    session.ts            Demo entry storage, no real authentication
    DemoSessionProvider.tsx
    useDemoSession.ts
  lib/                    Formatting, time hook, errors and class merging
  test/                   DOM setup and route/planner interaction tests
```

Pages compose focused components rather than containing every concern.
There is no Redux, Next.js, global state library, or hospital/team administration.
React Context shares only the demo entry and workspace; filters, dialogs, and
form state stay local. Pages are lazy-loaded, while the shared shell remains
visible during route loading.

shadcn/ui components are source code in this repository, not an opaque theme.
The palette, spacing, focus treatments, and touch targets are customized.
Native selects provide conventional, accessible single-choice controls; Radix
handles dialogs, sheets, and checkboxes. Add new primitives only when used.

## React for an AngularJS developer

| AngularJS concept                  | React equivalent here                                                   |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Component bindings / isolate scope | Typed props such as `TaskRowProps`; values flow from parent to child    |
| `$scope` values                    | `useState`; call the setter instead of mutating a value                 |
| `ng-click`                         | `onClick`; pass a callback                                              |
| `ng-repeat`                        | `array.map(...)` with a stable `key` such as a task ID                  |
| `ng-if`                            | Conditional JSX, e.g. `error && <ErrorState ... />`                     |
| `ng-model`                         | Controlled `value` / `checked` plus `onChange`                          |
| `$watch` / lifecycle hooks         | `useEffect` for external synchronization, with dependencies and cleanup |
| Services / DI                      | Imported repository functions and narrowly scoped Context providers     |
| UI Router / route views            | React Router `Routes`, `Route`, nested `Outlet`, `Link` and `NavLink`   |
| Form validation directives         | React Hook Form state plus a Zod schema                                 |

### Components and props

A component is a function that returns JSX. `TaskRow` receives a task and typed
callbacks; it does not fetch data. The parent owns the update and passes
`onComplete`, `onEdit`, and `onDelete`. Props are read-only inputs, not two-way
bindings. Callback props communicate changes upward.

### State and rendering

Calling a state setter requests another render. Treat arrays and objects as
immutable: create a new array with `map` or `filter`, rather than editing the
existing state. The pure mutations follow this pattern, so business rules can be
tested without rendering a browser.

Derived counts and filtered tasks are computed from existing state. They do not
need extra state or watchers. State updates can be batched; do not expect a setter
to change the current function's local variable immediately.

### Effects and custom hooks

Effects are for synchronization with outside systems, not for calculating totals
or responding to button clicks. `WorkspaceProvider` loads through the repository
and ignores results after unmounting. `useNow` owns a timer and clears it in its
cleanup. React StrictMode runs extra lifecycle checks in development, so effects
must tolerate setup/cleanup more than once.

`useWorkspace` and `useDemoSession` provide a small typed Context API.
Custom hooks reuse stateful behavior; they are not magical shared state unless
they explicitly access shared Context. Call hooks at the top level, not inside
conditions, loops, or event handlers.

### Controlled forms

The room-code and filter fields use local `value` and `onChange`. Larger forms use
React Hook Form's `Controller` through shadcn `FormField`; fields remain
controlled, while the form library manages validation, touched fields, and
submission state. Zod defines validation once and infers `TaskFormValues` and
`ShiftFormValues`. Validation messages are associated with their controls and
announced; failed writes keep the form open and preserve its values.

### Routing and future Supabase fetching

`App.tsx` defines every requested route. The shared layout is the parent route,
and `Outlet` renders the selected page. `useParams` reads `shiftId`;
`useSearchParams` supports dashboard quick actions and the overdue shortcut.
Route changes use links instead of directly changing `window.location`.

At present the data-access layer uses a fictional snapshot. Pages call
`useWorkspace`; they never call browser storage directly. Writes persist before
the UI reports success. When Supabase is introduced, add a separate client and
entity-level repositories, convert database snake_case fields at that boundary,
and fetch user-owned records using the authenticated session. Do not upload the
whole browser snapshot or treat client-side demo guards as access control.
Authentication/session subscription logic belongs outside visual form components.

## Next stages: Supabase checklist

1. Add Supabase Auth sign up, sign in, sign out, reset-email and password-update
   flows. Handle expired links, loading, errors, and session subscription cleanup.
2. Replace demo entry with genuine protected routes and persisted onboarding
   profiles (`student` / `new graduate RN`).
3. Add versioned SQL migrations for `profiles`, `shifts`, `tasks`, `handoffs`,
   `reflections`, and `learning_notes`.
4. Give each owned row a relationship to `auth.users`. Enable RLS on all six
   tables. Add SELECT/DELETE `USING` and INSERT/UPDATE `WITH CHECK` policies
   enforcing `auth.uid() = user_id` (profile ownership by profile ID).
5. Enforce same-owner references to shifts at the database level. An owned task
   or handoff must not reference another user's shift.
6. Verify CRUD and relationship restrictions with **two distinct test users**
   and direct API calls, not just UI hiding. Anonymous access must be rejected.
   Do not use the service-role key to test RLS: it bypasses policies.
7. Keep fictional seed data separate from real accounts. Add mocked Supabase
   authentication and repository tests, including saving a handoff draft.
8. Build the SBAR editor and copy/print views, then reflection and educational
   note editors. Preserve all safety notices and avoid clinical generation.

These are prerequisites for private account deployment, not already-verified
capabilities.

## Tests and accessibility

The initial suite covers demo route entry/exit, perspective selection, creating,
editing, deleting, completing and filtering tasks, form validation, overnight
due dates, single-active-shift rules, ending shifts, read-only history, empty
states, loading, load retries, save errors, local persistence, corrupt storage,
ownership-shape validation, and quota failures. Repositories are injected/mocked
in UI tests. No live Supabase calls are made.

Real authentication, RLS isolation, and saving handoff drafts need tests when
those features are implemented; no passing test is claimed for deferred features.

The UI includes a skip link, semantic navigation/headings, visible keyboard focus,
associated labels/errors, text-based priority distinctions, reduced-motion
support, 44px primary controls, and focus-managed Radix dialogs/mobile navigation.
Browser checks cover desktop/mobile layouts, navigation, and a mobile task save.
This is not a claim of a complete WCAG or assistive-technology audit.

Dependency note: the initial install's `npm audit --omit=dev` reports no runtime
advisories. The full audit reports a moderate transitive `minimatch` advisory in
the TypeScript ESLint tooling. Do not apply the suggested parser downgrade or an
unsupported major-version override without checking TypeScript compatibility;
track the upstream tooling fix. This is not part of the shipped static JS.

## Deploy the fictional demo

This is a Vite SPA, so no Node application server is required after building.
Do not market or use this deployment as private authenticated storage.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `24`
- Add an SPA rewrite so refreshing a nested route returns `index.html`.
  For example, create `public/_redirects` with `/* /index.html 200` before
  deployment. Vite copies it into `dist`.

### Vercel or another static host

Select the Vite preset, build with `npm run build`, and publish `dist`. Configure
unknown application routes to rewrite to `/index.html` (preserve real asset
paths). For Vercel, an equivalent `vercel.json` rewrite is:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Deployment smoke check: open `/dashboard` in a fresh browser (demo entry must
appear), enter the demo, open a shift, create a fictional task, and refresh
`/shifts/shift-current` directly. Verify navigation at 390px and desktop widths.
Use HTTPS. Browser demo data is origin-specific; development and deployed sites
do not share local storage.

For future Supabase deployment, configure the site URL and approved
authentication/reset redirect URLs, apply and verify migrations/RLS before
enabling private writes, and set only public/publishable frontend credentials.
