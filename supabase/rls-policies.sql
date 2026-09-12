-- Row Level Security for the PMO Task Tracker (build-sequence Phase 2).
--
-- Apply this AFTER the initial Prisma migration has created the tables
-- (`npx prisma migrate dev`). Run it in the Supabase SQL editor, or via
-- `psql "$DIRECT_URL" -f supabase/rls-policies.sql`.
--
-- Why RLS matters here: the app talks to Postgres two different ways.
--   - lib/prisma.ts connects directly as a privileged Postgres role and
--     BYPASSES RLS by design. It's used only for migrations and privileged
--     server-side jobs (the /api/sync webhook, authenticated by shared
--     secret rather than a user session).
--   - lib/supabase/{client,server}.ts run queries as the signed-in user
--     (the `authenticated` role, via their session JWT) through Supabase's
--     API. RLS below is what actually gates that path — it's the real
--     enforcement for QA-facing reads/writes, not just an app-layer check.
--
-- v1 write scope (confirmed): QA may only edit `start_date`/`end_date` on
-- periods belonging to projects they're assigned to. Priority, status
-- override, and reassignment are NOT writable by QA in v1 even though the
-- design draft shows them as inline-editable — see docs/architecture-decisions.md
-- addendum. RLS below only allows UPDATE on `period`; there is no UPDATE
-- policy for `project`, `assignment`, or `status_override` for the
-- `authenticated` role — those stay effectively read-only from the client
-- until a PM/Manager/Admin role is added.

-- Helper: resolve the calling user's `person.id` from their auth uid.
-- SECURITY DEFINER so it can read `person` regardless of the caller's own
-- row-level access, but it only ever returns the caller's own id.
create or replace function current_person_id()
returns text
language sql
security definer
stable
as $$
  select id from person where auth_user_id = auth.uid()
$$;

-- Helper: does the calling user hold a given role in the `role` table?
-- v1 only ever populates 'QA', but this is written generically so
-- PM/MANAGER/ADMIN can be added later without touching any policy.
create or replace function has_role(check_role "UserRole")
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from role
    where person_id = current_person_id() and role = check_role
  )
$$;

alter table project enable row level security;
alter table period enable row level security;
alter table assignment enable row level security;
alter table person enable row level security;
alter table role enable row level security;
alter table status_override enable row level security;

-- person: readable by any authenticated user (names/initials for avatars
-- across the whole site are not sensitive in this internal tool). No client
-- INSERT/UPDATE/DELETE policy — person rows are written by privileged
-- server code only (login upsert, sync-created placeholders, Add New Task).
create policy "person_select_authenticated" on person
  for select
  to authenticated
  using (true);

-- role: a person can see only their own role grant(s).
create policy "role_select_own" on role
  for select
  to authenticated
  using (person_id = current_person_id());

-- assignment: a person can see assignment rows that name them.
create policy "assignment_select_own" on assignment
  for select
  to authenticated
  using (person_id = current_person_id());

-- project: visible if the caller has any assignment on it (QA decision #7:
-- "see tasks assigned to them"). No UPDATE policy for v1 — see header note.
create policy "project_select_assigned" on project
  for select
  to authenticated
  using (
    exists (
      select 1 from assignment
      where assignment.project_id = project.id
        and assignment.person_id = current_person_id()
    )
  );

-- period: visible under the same "assigned to this project" rule as project.
create policy "period_select_assigned" on period
  for select
  to authenticated
  using (
    exists (
      select 1 from assignment
      where assignment.project_id = period.project_id
        and assignment.person_id = current_person_id()
    )
  );

-- period: the ONE write path QA has in v1 — start/end dates, own projects
-- only. The app is responsible for setting source = 'site_override' on
-- this write path (see docs/data-model.md's override pattern); RLS enforces
-- *which rows* can be touched, not which columns.
create policy "period_update_assigned" on period
  for update
  to authenticated
  using (
    has_role('QA') and exists (
      select 1 from assignment
      where assignment.project_id = period.project_id
        and assignment.person_id = current_person_id()
    )
  )
  with check (
    has_role('QA') and exists (
      select 1 from assignment
      where assignment.project_id = period.project_id
        and assignment.person_id = current_person_id()
    )
  );

-- status_override: visible under the same "assigned to this project" rule.
-- No client UPDATE policy in v1 (status override is not in QA's confirmed
-- write scope) — set only by privileged server code.
create policy "status_override_select_assigned" on status_override
  for select
  to authenticated
  using (
    exists (
      select 1 from assignment
      where assignment.project_id = status_override.project_id
        and assignment.person_id = current_person_id()
    )
  );
