# Build Sequence (for Claude Code)

Checklist form of `PROJECT_BRIEF.md` Section 9.

- [ ] 1. Scaffold Next.js app, connect GitHub repo, deploy empty skeleton to Vercel.
- [ ] 2. Stand up Supabase project: schema from `docs/data-model.md` / `prisma/schema.prisma`, Google OAuth provider, RLS policies gated on the role table (QA role only for now).
- [ ] 3. Build `/api/sync` webhook + the Apps Script `onEdit` trigger (draft in `scripts/apps-script/`) against a copy/sandbox tab first — confirm push works end to end before pointing at the real 8 tabs.
- [ ] 4. Build Project Overview and Track by Person pages against real Supabase data, porting the interaction design from the offline prototype (Section 8 of the brief).
- [ ] 5. Wire QA's period-editing action to the database write path (never the Sheet).
- [ ] 6. Connect all 8 real tabs, run the sync against live data, verify bracket-stripping and status mapping against real rows before calling it done.
