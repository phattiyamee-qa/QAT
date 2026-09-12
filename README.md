# QAT Program — PMO Task Tracker

Status: **pre-build** — architecture locked, folder skeleton in place, no code written yet.

A team-wide project tracker. The Google Sheet stays the system of record for PM input; QA gets a purpose-built dashboard (workload, assignment, progress) with its own edit surface that never writes back to the Sheet.

## Start here

- [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) — the full product & architecture brief. Read this first.
- [`docs/architecture-decisions.md`](docs/architecture-decisions.md) — locked decisions, quick-reference table. Do not re-litigate without a reason.
- [`docs/data-model.md`](docs/data-model.md) — conceptual schema + the sheet/site override pattern.
- [`docs/build-sequence.md`](docs/build-sequence.md) — the implementation checklist for Claude Code.
- [`docs/CLAUDE_DESIGN_PROMPT.md`](docs/CLAUDE_DESIGN_PROMPT.md) — ready-to-paste prompt for Claude Design covering the three screens.
- [`docs/CLAUDE_CODE_BUILD_PLAN.md`](docs/CLAUDE_CODE_BUILD_PLAN.md) — ready-to-paste, looped build plan for Claude Code, gated on the design system and locked architecture.

## Folder layout

```
QAT Program/
├── README.md                      ← you are here
├── docs/
│   ├── PROJECT_BRIEF.md           full brief (source of truth)
│   ├── architecture-decisions.md  locked decisions, quick-reference
│   ├── data-model.md              conceptual schema + override pattern
│   ├── build-sequence.md          implementation checklist
│   ├── CLAUDE_DESIGN_PROMPT.md    prompt for Claude Design
│   ├── CLAUDE_CODE_BUILD_PLAN.md  looped build plan for Claude Code
│   └── design/                    Claude Design's output lands here (tokens, screens)
├── app/
│   └── README.md                  where the Next.js app + /api/sync route will live
├── prisma/
│   └── schema.prisma              draft schema translated from docs/data-model.md
└── scripts/
    └── apps-script/
        ├── README.md
        └── Code.gs                draft onEdit trigger + webhook POST
```

## One-line summary of the architecture

Google Sheet (8 tabs) → Apps Script `onEdit` trigger → webhook (`/api/sync`) → Postgres (Supabase) → Next.js dashboard (Google OAuth, QA role in v1) → QA edits periods directly in the DB, never back to the Sheet.

## What's NOT here yet

This is a folder skeleton and reference material, not a running app. No `package.json`, no installed dependencies, no deployed Vercel project. The `prisma/schema.prisma` and `scripts/apps-script/Code.gs` files are **drafts** for Claude Code to validate and refine against Section 9 of the brief — not production-ready code.

The offline HTML prototype referenced in Section 8 of the brief is a separate, already-existing file — treat its interaction patterns as the visual/UX reference, not as a codebase to extend.
