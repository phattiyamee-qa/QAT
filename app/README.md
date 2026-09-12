# app/ (placeholder)

This folder is where the actual Next.js application code goes once Claude Code scaffolds the project (`docs/build-sequence.md`, step 1). Nothing here is initialized yet — no `package.json`, no `node_modules`.

Expected structure once scaffolded (App Router):

```
app/
├── layout.tsx
├── page.tsx                       Project Overview (Section 5.1 of the brief)
├── person/[personId]/page.tsx     Track by Person (Section 5.2)
├── new/page.tsx                   Add New Task (Section 5.3)
├── api/
│   └── sync/route.ts              webhook the Apps Script trigger posts to (Section 3)
├── auth/                          Google OAuth (NextAuth or Supabase Auth)
└── components/                    shared UI: project row, gantt bar, avatar chips, etc.
```

## Notes for whoever builds this

- `api/sync/route.ts` authenticates the incoming request with a shared secret header, normalizes the row (bracket-strip title, map status, resolve PM/QA as plain text), then upserts into Postgres using the stable per-row key described in `docs/data-model.md`.
- Any page-level write from a QA user (period date edits) goes through a server action or its own API route straight to Postgres — it must never touch `api/sync` or the Sheet.
- Port interaction patterns (inline edit rows, split-fill progress bar, collapsible categories, avatar chips) from the offline HTML prototype (brief Section 8) — treat it as a UX reference, not a codebase to extend.
