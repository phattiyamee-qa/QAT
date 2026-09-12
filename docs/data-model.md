# Data Model (conceptual)

Source: `PROJECT_BRIEF.md` Section 4. Not a final schema — see `prisma/schema.prisma` for a draft translation Claude Code can refine.

## Entities

**project**
- id
- title (bracket-stripped)
- category / tab
- priority
- remark
- created_from: `'sheet' | 'site'`
- sheet_row_ref (nullable)

**period**
- id
- project_id
- phase: `'UAT' | 'LIVE'`
- start_date (nullable)
- end_date (nullable)
- source: `'sheet' | 'site_override'`

**assignment**
- project_id
- person_id
- role_on_project: `'QA' | 'PM'`

**person**
- id (app-generated, cuid) — deliberately *not* Supabase Auth's `auth.users.id`, because a person can exist purely as a plain-text name synced from the Sheet or typed into Add New Task, and may never log in.
- name
- email
- google_sub (from OAuth, kept for reference)
- auth_user_id (nullable, uuid) — set to `auth.users.id` once/if this person actually authenticates via Google OAuth. RLS policies join through this column, not `id`. Matching a sheet-derived person to a real login is exact email/name equality for v1; automatic/fuzzy matching is out of scope (brief §7).

**role**
- person_id
- role: `'QA' | 'PM' | 'MANAGER' | 'ADMIN'` — v1 only populates QA

**status_override**
- project_id
- status: `'UAT' | 'LIVE' | 'DONE' | 'SKIPPED'`
- set_by
- set_at

This is the manual status field from the prototype; it lives in the DB now instead of localStorage, and is never overwritten by an incoming sheet sync for the same project unless the sheet-derived status actually changed.

## The override pattern (critical)

Since QA can edit period dates on the site, and the Sheet can also update dates for the same project, the sync job must not blindly clobber a site-made edit.

Rule: a field is either sheet-owned or site-owned per project, tracked via `source`. A later sheet sync updates sheet-owned fields freely but does not touch fields already marked `site_override`.

This mirrors the prototype's `overrides` object layered on top of static data — same concept, backed by Postgres instead of localStorage.

## Upsert key (sync job)

Because sync is incremental, the upsert key must be a stable identifier per Sheet row — e.g. `tab name + row number`, or a dedicated ID column added to the sheet — not row position alone, since rows can be inserted or reordered.
