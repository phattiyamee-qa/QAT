import type { OverrideStatus, Period } from "@prisma/client";

// The status color lifecycle is a fixed system (PROJECT_BRIEF.md §5.1), not
// a per-project free choice:
//   white  = not started, or still in UAT
//   yellow = UAT done, waiting for Live
//   green  = Live in progress
//   gray   = Done (both phases complete) — Skipped reuses gray with a
//            different label, since neither is "in flight" any more
//   (distinct) no timeline = no dates set on either phase yet
//
// When there's no manual status_override, the state is derived from period
// dates against a reference date (never the actual current date - Track by
// Person's reference-date control drives this everywhere). The exact
// boundary rules below (e.g. "done" the instant Live's end date has passed)
// aren't spelled out to the day in the brief; this is a reasonable reading
// of it, not a re-litigation of the locked decisions.

export type StatusKey =
  | "not_started"
  | "in_uat"
  | "pending_live"
  | "live"
  | "done"
  | "skipped"
  | "no_timeline";

export type StatusVisual = {
  key: StatusKey;
  label: string;
  dot: string;
  dotBorder: string;
  bg: string;
  border: string;
};

const VISUALS: Record<StatusKey, StatusVisual> = {
  not_started: {
    key: "not_started",
    label: "Not started",
    dot: "var(--shopee-color-white)",
    dotBorder: "1px solid var(--shopee-color-border)",
    bg: "var(--shopee-color-white)",
    border: "1px solid var(--shopee-color-border)",
  },
  in_uat: {
    key: "in_uat",
    label: "In UAT",
    dot: "var(--shopee-color-white)",
    dotBorder: "1px solid var(--shopee-color-border)",
    bg: "var(--shopee-color-white)",
    border: "1px solid var(--shopee-color-border)",
  },
  pending_live: {
    key: "pending_live",
    label: "UAT done – waiting Live",
    dot: "var(--shopee-tag-warning-text)",
    dotBorder: "none",
    bg: "var(--shopee-tag-warning-bg)",
    border: "1px solid transparent",
  },
  live: {
    key: "live",
    label: "Live now",
    dot: "var(--shopee-tag-success-text)",
    dotBorder: "none",
    bg: "var(--shopee-tag-success-bg)",
    border: "1px solid transparent",
  },
  done: {
    key: "done",
    label: "Done",
    dot: "var(--shopee-color-text-tertiary)",
    dotBorder: "none",
    bg: "var(--shopee-tag-expired-bg)",
    border: "1px solid transparent",
  },
  skipped: {
    key: "skipped",
    label: "Skipped",
    dot: "var(--shopee-color-text-tertiary)",
    dotBorder: "none",
    bg: "var(--shopee-tag-expired-bg)",
    border: "1px solid transparent",
  },
  no_timeline: {
    key: "no_timeline",
    label: "No timeline",
    dot: "transparent",
    dotBorder: "1px dashed var(--shopee-color-text-quaternary)",
    bg: "var(--shopee-color-bg-module)",
    border: "1px dashed var(--shopee-color-border)",
  },
};

const OVERRIDE_TO_KEY: Record<OverrideStatus, StatusKey> = {
  UAT: "in_uat",
  LIVE: "live",
  DONE: "done",
  SKIPPED: "skipped",
};

export function computeStatusKey(
  periods: Pick<Period, "phase" | "startDate" | "endDate">[],
  overrideStatus: OverrideStatus | null | undefined,
  referenceDate: Date,
): StatusKey {
  if (overrideStatus) return OVERRIDE_TO_KEY[overrideStatus];

  const uat = periods.find((p) => p.phase === "UAT");
  const live = periods.find((p) => p.phase === "LIVE");
  const hasAnyDate = [uat?.startDate, uat?.endDate, live?.startDate, live?.endDate].some(
    (d) => d != null,
  );
  if (!hasAnyDate) return "no_timeline";

  if (live?.endDate && live.endDate <= referenceDate) return "done";
  if (live?.startDate && live.startDate <= referenceDate) return "live";
  if (uat?.endDate && uat.endDate <= referenceDate) return "pending_live";
  if (uat?.startDate && uat.startDate <= referenceDate) return "in_uat";
  return "not_started";
}

export function statusVisual(key: StatusKey): StatusVisual {
  return VISUALS[key];
}

// A project counts as "in progress" (for the Project Overview toggle) only
// while actively underway — brief §5.1 explicitly excludes both "finished"
// and "not started" from this toggle.
export function isInProgress(key: StatusKey): boolean {
  return key === "in_uat" || key === "pending_live" || key === "live";
}

// The 7 stat cards (brief §5.1) are coarser than the 7 StatusKeys: "Not
// started" is one card covering both the not_started and in_uat states
// (both render as the "white" badge).
export type StatCategory =
  | "all"
  | "not_started"
  | "pending_live"
  | "live"
  | "done"
  | "no_timeline"
  | "skipped";

export function statCategory(key: StatusKey): Exclude<StatCategory, "all"> {
  if (key === "in_uat") return "not_started";
  return key;
}
