# Claude Code Build Plan — PMO Task Tracker (looped build)

Paste this into a Claude Code session to drive implementation. It expands `docs/build-sequence.md` into a repeatable build loop, gated on the locked architecture (`docs/architecture-decisions.md`, `docs/data-model.md`, `prisma/schema.prisma`) and on whatever Claude Design has produced (`docs/design/`).

## Before starting: two documents you must read

1. `docs/architecture-decisions.md` + `docs/data-model.md` + `prisma/schema.prisma` — the locked decisions and data model. Do not deviate from these without flagging it to the user first; they were explicitly decided and are not up for re-litigation mid-build.
2. `docs/design/` — wherever Claude Design's output lives (tokens, component specs, screen exports, or a Figma link left in `docs/design/README.md`). If this folder is empty or missing, stop and ask the user for the design output before writing any UI code — do not invent colors, spacing, or component patterns from scratch.

## The loop

Each phase below follows the same four-step loop. Do not skip steps or batch multiple phases together — this keeps every phase independently verifiable and revertible.

1. **Plan** — restate what this phase builds and which files it touches, in 3-5 bullets, before writing code.
2. **Build** — implement the phase.
3. **Verify** — run the checklist below for this phase. If anything fails, fix it before moving on; do not carry known-broken state into the next phase.
4. **Checkpoint** — commit with a message naming the phase (e.g. `feat: phase 2 - supabase schema + prisma`), then report status in one paragraph before starting the next phase.

### Per-phase verification checklist

- **Architecture conformance**: does this phase respect the locked decisions (one-way sync, site writes never touch the Sheet, QA-only role gating, push not poll)? Cross-check against `docs/architecture-decisions.md`.
- **Schema conformance**: do any new fields/tables match `prisma/schema.prisma` and `docs/data-model.md`? If the real Supabase schema needs to diverge, update the Prisma file in the same commit — never let them drift silently.
- **Design conformance** (UI phases only): do colors, spacing, typography, and component behavior match `docs/design/`? Specifically: the status color lifecycle (white/yellow/green/gray/no-timeline), the split-fill Gantt bar treatment, and the inline-edit pattern must match the design output exactly, not an approximation.
- **Empty states**: does every list/section have a designed empty state, per the cross-cutting requirement in the brief (Section 5.4)? No blank areas, no "undefined."
- **Build passes**: `npm run build` (or equivalent) succeeds with no type errors.
- **Manual smoke test**: the phase's feature actually works when clicked through, not just compiles.

## Phases

### Phase 0 — Guardrails read-through
Read `docs/PROJECT_BRIEF.md`, `docs/architecture-decisions.md`, `docs/data-model.md`, `prisma/schema.prisma`, and `docs/design/`. Summarize back (to the user, not just internally) the locked decisions and design tokens you'll be building against, so any misunderstanding surfaces before code is written.

### Phase 1 — Scaffold
- Initialize the Next.js app (App Router) inside `app/`.
- Connect to the GitHub repo; deploy an empty skeleton to Vercel (Hobby tier).
- Set up the design system's tokens (colors, spacing, type scale) as a shared theme file (Tailwind config, CSS variables, or equivalent) — sourced from `docs/design/`, not guessed.

### Phase 2 — Data layer
- Stand up the Supabase project.
- Apply `prisma/schema.prisma` (review it first — it's a draft; confirm field names/types against real Supabase conventions before migrating).
- Set up Google OAuth as the Supabase auth provider.
- Write RLS policies gated on the `role` table — QA role only for v1, structured so PM/Manager/Admin slot in later without a schema change.

### Phase 3 — Sync webhook + Apps Script
- Build `/api/sync` per `app/README.md` and `docs/data-model.md`: authenticate via shared-secret header, bracket-strip titles, map status text to canonical states, upsert by the stable per-row key (never row position).
- Adapt `scripts/apps-script/Code.gs` (currently a draft) and test the `onEdit` trigger against a copy/sandbox tab — not the real 8 tabs — per `scripts/apps-script/README.md`.
- Confirm end-to-end: edit the sandbox sheet, see the row land correctly in Postgres.

### Phase 4 — Project Overview page
- Build against real Supabase data, matching `docs/design/` for the Project Overview screen: category grouping with collapsible sections + status-distribution bar, stat-card filters, search/filter chips, in-progress toggle, project rows with the fixed status color lifecycle, inline edit (icon-only trigger, embedded form).
- Editable/creatable dropdowns (QA assignment, category) must visually distinguish "select existing" from "create new."

### Phase 5 — Track by Person page
- Person selector, reference-date control (prev/next/today/date-picker) driving all progress math — never the actual current date.
- 3-week rolling Gantt for UAT and Live, split-fill bars (elapsed vs. remaining, percentage centered), Done/Skipped list sections, No-timeline section with "set timeline" promotion into the Gantt.
- Same inline-edit pattern as Project Overview; edits here and on Project Overview must reflect the same underlying record (no separate state).

### Phase 6 — Add New Task
- Form per `docs/CLAUDE_DESIGN_PROMPT.md` Section 3 / the design output: name, priority, editable/creatable category, phase, optional dates, multi-select assignee (search existing + add-new-by-Enter, uncapped).
- Save confirmation with direct links to each assignee's Track by Person page.
- Saved rows get `created_from = 'site'`.

### Phase 7 — QA write path
- Wire QA's period-date edits to a server action / API route that writes directly to Postgres, marking the field `site_override` per the override pattern in `docs/data-model.md`.
- Confirm this path never touches `/api/sync` or the Sheet.
- Confirm a subsequent sheet-driven sync does NOT clobber a `site_override` field for the same project — this is the single highest-risk regression in the whole system; write a test for it specifically.

### Phase 8 — Full cutover
- Point the Apps Script trigger at all 8 real tabs (Payment, Platform, Credit, Insurance, AS, MS, Foms, DP/LS).
- Run the sync against live data; verify bracket-stripping and status mapping against real rows, not just sandbox data.
- Confirm Supabase's free-tier pause behavior (7 days idle) is handled — a keep-alive ping or an accepted manual-resume step, per `docs/architecture-decisions.md`.

## What "done" means for this build

All 8 phases pass their verification checklist, the app is live on Vercel reading real synced data, QA can log in with Google OAuth and edit their own task periods without those edits ever reaching the Sheet, and the visual result matches `docs/design/` closely enough that it wouldn't need a follow-up design-QA pass.

## Explicitly not part of this plan

Everything in `docs/PROJECT_BRIEF.md` Section 7 (two-way sync, non-QA roles, automatic person-matching, multi-spreadsheet support) — do not build ahead of scope even if it looks easy to add while touching adjacent code.
