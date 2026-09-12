# Apps Script sync trigger (draft)

`Code.gs` in this folder is a **draft** implementation of the push side of the sync (brief Section 3): an `onEdit` trigger that posts changed rows to `/api/sync`.

## Before wiring to the real sheet

Per `docs/build-sequence.md` step 3:

1. Test against a copy/sandbox tab first — not the real 8 tabs.
2. Confirm the webhook receives rows correctly, bracket-stripping and status mapping behave as expected, and the shared-secret header check works.
3. Only then point the trigger at the real spreadsheet (Payment, Platform, Credit, Insurance, AS, MS, Foms, DP/LS).

## Setup (once validated)

1. Open the target Google Sheet → Extensions → Apps Script.
2. Paste `Code.gs`, set the `WEBHOOK_URL` and `SHARED_SECRET` script properties (File → Project properties → Script properties — do not hardcode the secret).
3. Add an installable `onEdit` trigger (simple triggers can't make external HTTP calls) pointed at `onEditTrigger`.
4. Scope the trigger to only the 8 tracked tabs — see `TRACKED_SHEETS` in `Code.gs`.

## Stable row identity

Row position alone is not a safe upsert key (rows get inserted/reordered). `Code.gs` assumes a dedicated ID column per tracked sheet — confirm the column name/position per tab before going live, per `docs/data-model.md`.
