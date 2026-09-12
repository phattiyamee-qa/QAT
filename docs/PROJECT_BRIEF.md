# PMO Task Tracker — Product & Architecture Brief

Status: pre-build ideation, locked decisions below
Prepared for: Claude Cowork (working-folder setup) and Claude Design (screen design), handoff into Claude Code for implementation

## 1. What this is

A lightweight, team-wide project tracker that keeps the Google Sheet as the system of record for PM input, while giving QA (and later, other roles) a purpose-built dashboard for workload, assignment, and progress — with its own editing surface that never writes back to the Sheet.

It grew out of a single-file HTML prototype (still kept as an offline demo — see Section 8) built to visualize one QA tracker spreadsheet. This brief generalizes that prototype into a real, hosted, multi-user product.

## 2. Locked architecture decisions

These were explicitly decided and should not be re-litigated without a reason:

- Sync direction is one-way: Master Sheet → Database. Apps Script pushes edits out; the site never writes back to the Sheet.
- The site has its own write path: users can make changes directly in the PMO site (e.g. QA adjusting a period's dates). Those writes go to the database only.
- One spreadsheet, permanently, with 8 tabs: Payment, Platform, Credit, Insurance, AS, MS, Foms, DP/LS. The sync layer must tolerate incremental structural changes to that sheet (columns added/reordered) without a full rewrite.
- Sync is push-based, not polled — an Apps Script `onEdit` trigger posts changed rows to a webhook the moment they change. (Note: Vercel's free-tier Cron is capped at once per day, so a polling design would not meet the real-time requirement — push avoids that limit entirely.)
- Auth is Google OAuth only. No password auth.
- Role-based access, starting with one role: QA. The permission model should be built to extend to PM/Manager/Admin later, but v1 only needs to fully support QA.
- QA can, in v1:
  - See the tasks assigned to them (assignment comes from the Sheet / QA Manager)
  - Change the period (start/due dates) of each state — UAT and Live — for their own tasks
- Free-tier hosting, GitHub-connected, Vercel deploy-ready.

See `docs/architecture-decisions.md` for this same list as a standalone quick-reference.

## 3. Input → Process → Output

### Input

- PM and QA edit the Google Sheet directly (existing workflow, unchanged).
- Users authenticate to the website via Google OAuth.
- QA edits period dates directly on the website.

### Process

- Apps Script `onEdit` trigger fires on any change to the 8 tracked tabs.
- It posts the changed row(s) to a webhook (`/api/sync`) on the Vercel app, authenticated with a shared secret header.
- The webhook normalizes the row:
  - Strip bracketed text `[...]`, `(...)`, `{...}` from the project title, always.
  - Map the raw status text to canonical states: `UAT` → Pending UAT; explicit Pending Live passes through as-is; plain Live (fully released) is dropped — considered stale, not synced.
  - Resolve PM name and QA name as plain text fields (name-matching to user accounts is a v1.1 concern, not required to launch).
- The row is upserted into Postgres. Because this is incremental, the upsert key should be a stable identifier per Sheet row (e.g. tab name + row number, or a dedicated ID column in the sheet) — not row position alone, since rows can be inserted/reordered.
- Separately, when a QA user edits a period on the website, that write goes directly to Postgres via a Next.js API route/server action — it does not touch the Sheet and is not visible to the sync job.

### Output

- The dashboard (Project Overview, Track by Person — see Section 5) reads from Postgres.
- QA sees their assigned tasks by default; role gates which pages/actions are visible.

## 4. Data model (conceptual — not final schema)

- **project** — id, title (bracket-stripped), category/tab, priority, remark, created_from ('sheet' | 'site'), sheet_row_ref (nullable)
- **period** — id, project_id, phase ('UAT' | 'LIVE'), start_date (nullable), end_date (nullable), source ('sheet' | 'site_override')
- **assignment** — project_id, person_id, role_on_project ('QA' | 'PM')
- **person** — id, name, email, google_sub (from OAuth)
- **role** — person_id, role ('QA' | 'PM' | 'MANAGER' | 'ADMIN') — v1 only populates QA
- **status_override** — project_id, status ('UAT' | 'LIVE' | 'DONE' | 'SKIPPED'), set_by, set_at — this is the manual status field from the prototype; it lives in the DB now instead of localStorage, and is never overwritten by an incoming sheet sync for the same project unless the sheet-derived status actually changed.

See `docs/data-model.md` and `prisma/schema.prisma` for a draft schema translation.

The override pattern matters: since QA can edit period dates on the site, and the Sheet can also update dates for the same project, the sync job must not blindly clobber a site-made edit. Recommended rule: a field is either sheet-owned or site-owned per project, tracked via `source`; a later sheet sync updates sheet-owned fields freely but does not touch fields already marked `site_override`. This exact pattern already exists in the prototype (the `overrides` object layered on top of static data) — it should carry over conceptually, just backed by Postgres instead of localStorage.

## 5. Functional requirements (extracted from the working prototype)

Everything below was built and validated in the HTML prototype and should be treated as the baseline feature set for the real product — not a wishlist, a working spec.

### 5.1 Project Overview page

- All projects grouped by category (tab), with collapsible category sections and a mini status-distribution bar in each category header.
- Clickable summary stat cards (All / Not started / UAT done waiting Live / Live now / Done / No timeline / Skipped) that double as status filters.
- Category filter chips, free-text search across project title and assignee name.
- Toggle: show only projects currently in progress (as of a reference date) vs. show everything including finished/not-started.
- Each project row shows: title, remark, priority badge, assignee avatars (initials, color-coded), phase badges with date ranges, and a status badge (dot + label) reflecting lifecycle stage.
- Status coloring/lifecycle: white = not started or still in UAT, yellow = UAT done, waiting for Live, green = Live in progress, gray = Done (both UAT and Live complete), plus a distinct no-timeline state for projects with no dates yet.
- Inline edit (icon-only, no label) per project row: reassign QA (multi-person, editable dropdown that accepts new names), change priority, manually override status (Auto / UAT / Live / Done / Skipped), and edit each phase's start/due dates — all from one expandable form embedded in the row.
- Editing here immediately updates the Track by Person view for the affected assignee(s), and offers a direct link to jump to that person's page.
- New project categories can be created inline from the same editable dropdown (not a fixed list).

### 5.2 Track by Person page

- Person selector (dropdown, all assignees).
- A reference-date control (prev/next day, "today", direct date picker) that every progress calculation is computed against — not hardcoded to the actual current date.
- Gantt-style weekly grid (3-week rolling window, prev/next navigation) with day/week headers, for two sections: UAT and Live.
- Each task bar is split-filled: the portion of the period already elapsed (relative to the reference date) renders in a solid/dark color, the remainder in a lighter tint, with the percentage labeled in the center of the bar.
- Below the two Gantt sections: two simple list sections, Done and Skipped, for tasks manually marked as such (they're pulled out of the Gantt entirely once marked).
- A further No timeline yet section lists tasks with no start/due date at all, each with a "set timeline" action that, once dates are entered, promotes the task into the UAT/Live Gantt automatically.
- Every task, in every section, has an inline edit control for: task name, priority, status (Auto/UAT/Live/Done/Skipped), and start/due dates — sorted by priority within each section, and re-sorting live when priority changes.
- Editing a task's name or status here is the same shared record as on the Project Overview page — changes are instantly visible on both.

### 5.3 Add New Task (manual entry path)

- Task name, priority (P0–P3), category (editable dropdown, supports adding a new category inline), phase (UAT/Live), start/due dates (both optional — a task can be saved with "no timeline yet" and scheduled later).
- Assignee field is a proper multi-select: type to search existing people, click to add as a removable chip, or type a new name and press Enter to add someone not yet in the system. Not limited to two people.
- On save: confirmation with a direct link to jump to each assigned person's Track by Person page.
- A running list of manually-added/edited tasks with inline edit/delete, plus export/import of that data as a JSON backup (this was a localStorage-era safety net; in the real product this maps to normal database rows created with `created_from = 'site'`).

### 5.4 Cross-cutting behavior

- All text is in English throughout the UI (labels, buttons, empty states, weekday/month names). Actual project titles are left exactly as sourced.
- Every page degrades gracefully to an explicit empty state (no data yet) rather than showing blank sections or "undefined."

## 6. Non-functional requirements

- Auth: Google OAuth exclusively, gating the entire site.
- RBAC: role table keyed by email/Google subject; v1 implements the QA role fully, structured so PM/Manager/Admin roles can be added without a schema change.
- Sync latency: push-based via Apps Script trigger, effectively real-time (seconds, not minutes). Do not rely on Vercel's free-tier Cron for this — see Section 2.
- Hosting: Vercel, deploy-ready from a GitHub repo, free tier throughout (Vercel Hobby + Supabase Free). Be aware Supabase's free tier pauses a project after 7 days of no API traffic — needs a trivial keep-alive or an accepted manual-resume step.
- Data integrity: sheet-derived fields must never silently overwrite a site-made edit to the same field (see override pattern, Section 4).

## 7. Out of scope for v1 (explicitly deferred)

- Two-way sync (site edits flowing back into the Sheet).
- Roles beyond QA (PM/Manager/Admin dashboards, approvals, notifications).
- Automatic person-matching between Sheet text and user accounts (v1 stores PM/QA as plain text pulled from the sheet; linking that to actual logged-in accounts for permissions is a fast-follow).
- Multiple source spreadsheets (architecture should not preclude this later, but v1 targets exactly one).

## 8. What already exists — the offline prototype

A fully working single-file HTML prototype (localStorage-backed, no server) implements everything in Section 5 end to end, including the priority-sort, status lifecycle, and inline editing described above. It's being kept as-is as an offline/demo version — not wired to the Sheet or the database — useful for showing the intended UX while the real backend is built. Claude Design and Claude Code should treat its interaction patterns (inline edit rows, the split-fill progress bar, the collapsible category sections, the avatar chips) as the reference implementation for visual/interaction fidelity, not as a starting codebase to extend directly — the real app is a fresh Next.js build per Section 3.

## 9. Suggested build sequence (for Claude Code)

1. Scaffold Next.js app, connect GitHub repo, deploy empty skeleton to Vercel.
2. Stand up Supabase project: schema from Section 4, Google OAuth provider, RLS policies gated on the role table (QA role only for now).
3. Build `/api/sync` webhook + the Apps Script `onEdit` trigger against a copy/sandbox tab first, confirm push works end to end before pointing at the real 8 tabs.
4. Build Project Overview and Track by Person pages against real Supabase data, porting the interaction design from the prototype.
5. Wire QA's period-editing action to the database write path (never the Sheet).
6. Connect all 8 real tabs, run the sync against live data, verify bracket-stripping and status mapping against real rows before calling it done.

See `docs/build-sequence.md` for this same list as a standalone checklist.
