# Prompt for Claude Design — PMO Task Tracker

Paste this into a Claude Design session to kick off the screen design work.

---

I need high-fidelity screen designs for a web app called the **PMO Task Tracker** — an internal project tracker for a QA team. Full product/architecture context is in `docs/PROJECT_BRIEF.md` in this project if you have access to it; otherwise, here's everything you need.

## Product in one paragraph

A team-wide project tracker. A Google Sheet (8 tabs: Payment, Platform, Credit, Insurance, AS, MS, Foms, DP/LS) stays the system of record for PM input and stays untouched by the app. QA logs in with Google OAuth and gets a purpose-built dashboard of their assigned work — grouped by project, tracked across two phases (UAT and Live) — with the ability to edit their own task's dates and status directly in the app. v1 supports only the QA role; the design should read as clean for one role today but not preclude a PM/Manager/Admin role being added later (e.g. a role switcher or additional nav items slotting in without a rework).

## What to design

Three screens, each in populated, empty, and mid-edit states:

### 1. Project Overview

- Projects grouped by category (the 8 sheet tabs), each category collapsible, with a small status-distribution bar in the category header (a compact multi-segment bar showing the mix of statuses within that category).
- Summary stat cards across the top, each clickable as a filter: All, Not started, UAT done waiting Live, Live now, Done, No timeline, Skipped.
- Category filter chips + free-text search (matches project title and assignee name).
- A toggle: "in progress only" (as of a reference date) vs. show everything.
- Each project row: title, remark, priority badge, assignee avatars (initials, color-coded per person), phase badges showing UAT/Live date ranges, and a status badge (colored dot + label).
- Status color lifecycle — this is a fixed system, not a free choice: **white** = not started or still in UAT, **yellow** = UAT done, waiting for Live, **green** = Live in progress, **gray** = Done (both phases complete), plus a distinct visual treatment for **no-timeline** (no dates set yet).
- Inline edit per row: an icon-only trigger (no label) that expands an embedded form in place — reassign QA (multi-person, editable/creatable dropdown), change priority, manually override status (Auto/UAT/Live/Done/Skipped), edit each phase's start/due dates.
- The editable dropdowns for QA assignment and category both support typing a new value inline (not just picking from a fixed list) — the UI should make "create new" visually distinct from "select existing" in these dropdowns.

### 2. Track by Person

- Person selector at the top (dropdown of all assignees).
- A reference-date control (prev/next day arrows, a "today" shortcut, and a direct date picker) — every progress calculation on the page depends on this, so it needs to read as a global control for the page, not a minor setting.
- Two Gantt-style sections, UAT and Live: a 3-week rolling weekly grid (prev/next navigation), day/week headers.
- Each task bar is **split-filled**: the elapsed portion (relative to the reference date) in a solid/dark fill, the remainder in a lighter tint of the same color, with the percentage complete labeled centered in the bar. This is a core visual motif — get the contrast and legibility right at small bar heights.
- Below the Gantt sections: two plain list sections, **Done** and **Skipped** — tasks land here once manually marked, and disappear from the Gantt entirely.
- A **No timeline yet** section: tasks with no dates at all, each with a "set timeline" action; once dates are entered the task promotes itself into the UAT/Live Gantt.
- Every task everywhere has the same inline-edit pattern as Project Overview (name, priority, status, dates), and lists re-sort live by priority as it changes.

### 3. Add New Task

- Fields: task name, priority (P0–P3), category (editable/creatable dropdown), phase (UAT/Live), start/due dates (both optional — "no timeline yet" is a valid saved state).
- Assignee is a proper multi-select: type-to-search existing people as removable chips, or type a new name and press Enter to add someone not yet in the system. Not capped at two people.
- On save: a confirmation state with direct links to jump to each assigned person's Track by Person page.

## Design constraints

- Web app, desktop-first (this is an internal ops tool used at a desk), but should hold up reasonably at tablet width.
- All UI text in English — labels, buttons, empty states, weekday/month names. Don't localize.
- Every section needs an explicit, designed empty state ("no data yet") — never a blank area or placeholder text like "undefined."
- Keep information density fairly high — this is a working tool for people who'll use it daily, not a marketing surface. Favor compact rows and clear scanability over generous whitespace.

## Reference implementation

There's an existing offline HTML prototype that already implements all of this end-to-end (localStorage-backed, no server) — inline edit rows, the split-fill progress bar, collapsible categories, avatar chips, the priority-based sorting. Treat its interaction patterns as the reference for how things should behave; the visual polish is what needs upgrading, not the underlying interaction model. If you have access to the prototype file, look at it before designing; if not, the description above reflects it faithfully.

## Out of scope for this round

- Any PM/Manager/Admin-specific screens or views.
- Two-way sync UI (the app never writes back to the Sheet — no "push to sheet" affordance anywhere).
- Notifications, approvals, or activity feeds.
