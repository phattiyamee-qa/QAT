// Normalization logic for the Sheet -> DB sync (build-sequence Phase 3,
// PROJECT_BRIEF.md Section 3). Kept separate from app/api/sync/route.ts so
// it can be unit-tested without spinning up a request.

export const TRACKED_SHEETS = [
  "Payment",
  "Platform",
  "Credit",
  "Insurance",
  "AS",
  "MS",
  "Foms",
  "DP/LS",
] as const;

// PROVISIONAL — the real column header names have not been confirmed against
// an actual sheet tab yet. Code.gs sends the whole row as a header-keyed
// object (see scripts/apps-script/Code.gs), so fixing this map is the only
// change needed once the real headers are known; nothing else here assumes
// column order or position.
export const FIELD_MAP = {
  title: "Title",
  priority: "Priority",
  remark: "Remark",
  pm: "PM",
  qa: "QA",
  status: "Status",
  uatStart: "UAT Start",
  uatEnd: "UAT End",
  liveStart: "Live Start",
  liveEnd: "Live End",
} as const;

// Strip bracketed text [...] (...) {...} from a project title, per brief §3.
export function stripBracketedText(title: string): string {
  return title
    .replace(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Per brief §3: plain "Live" (fully released) is stale and must not be
// synced; "Pending Live" passes through; anything else (incl. "UAT") syncs
// normally. This only gates whether the row is processed at all — the raw
// status text itself isn't stored anywhere in the schema.
export function shouldSkipStatus(rawStatus: string | undefined | null): boolean {
  const normalized = (rawStatus ?? "").trim().toLowerCase();
  return normalized === "live";
}

export function parseSheetDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Sheet PM/QA cells are plain text and may list more than one name
// (comma-separated); split defensively even though PM is usually singular.
export function splitNames(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
