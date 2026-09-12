# Locked Architecture Decisions

Quick-reference only — full context lives in `PROJECT_BRIEF.md` Section 2. These were explicitly decided and should not be re-litigated without a reason.

| # | Decision |
|---|---|
| 1 | Sync direction is one-way: Master Sheet → Database. Apps Script pushes edits out; the site never writes back to the Sheet. |
| 2 | The site has its own write path: users can make changes directly in the PMO site (e.g. QA adjusting a period's dates). Those writes go to the database only. |
| 3 | One spreadsheet, permanently, with 8 tabs: Payment, Platform, Credit, Insurance, AS, MS, Foms, DP/LS. The sync layer must tolerate incremental structural changes (columns added/reordered) without a full rewrite. |
| 4 | Sync is push-based, not polled — an Apps Script `onEdit` trigger posts changed rows to a webhook the moment they change. Vercel's free-tier Cron (once/day) cannot meet the real-time requirement, so push is required, not just preferred. |
| 5 | Auth is Google OAuth only. No password auth. |
| 6 | Role-based access, starting with one role: QA. Permission model must extend to PM/Manager/Admin later without a schema change, but v1 only needs to fully support QA. |
| 7 | QA can, in v1: see tasks assigned to them, and change the period (start/due dates) of UAT and Live for their own tasks. |
| 8 | Free-tier hosting, GitHub-connected, Vercel deploy-ready (Vercel Hobby + Supabase Free). |

## Explicitly out of scope for v1

- Two-way sync (site edits flowing back into the Sheet).
- Roles beyond QA (PM/Manager/Admin dashboards, approvals, notifications).
- Automatic person-matching between Sheet text and user accounts.
- Multiple source spreadsheets.
