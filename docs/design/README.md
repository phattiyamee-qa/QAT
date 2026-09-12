# Design system output

Status: **DRAFT** (as of 2026-09-12) — confirmed by the user, still being iterated on in Claude Design. Do not treat component layouts/spacing here as pixel-final; the color/spacing/type **tokens** are real values and safe to build the shared theme against, but Phases 4-6 (actual screen implementation) should re-check against whatever supersedes this.

Contents:
- `shopee-tokens.css` — the token source (colors, spacing, radii, shadows, type scale). This is what `app/` wires up as the shared theme.
- `PMO Task Tracker.dc.html` — Claude Design canvas covering all three screens (Project Overview, Track by Person, Add New Task). Reference for layout/interaction intent only — it's a design-canvas export, not portable app code.
- `EditRow.dc.html` — the inline-edit row component spec.
- `support.js`, `assets/shopee-logo.svg` — canvas support script and brand asset.

When the user confirms the design is locked, update this file's status and re-run the design-conformance check across Phases 4-6.
