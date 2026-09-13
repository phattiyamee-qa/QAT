// Pure date/geometry helpers for Track by Person's 3-week rolling Gantt
// (PROJECT_BRIEF.md §5.2). Kept separate from the component for testability.

const DAY_MS = 86400000;
const WINDOW_DAYS = 21;

function startOfWeek(d: Date): Date {
  // Monday-start week.
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(d);
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

// The 21-day window shown for a Gantt section: centered on the reference
// date's week (previous week, current week, next week), shifted by
// weekOffset whole weeks via prev/next-week navigation.
export function buildWindow(referenceDate: Date, weekOffset: number) {
  const centeredStart = addDays(startOfWeek(referenceDate), -7);
  const start = addDays(centeredStart, weekOffset * 7);
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(start, i));
  const weeks = [0, 1, 2].map((w) => {
    const weekStart = days[w * 7];
    const weekEnd = days[w * 7 + 6];
    return {
      label: `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    };
  });
  return { start, end: addDays(start, WINDOW_DAYS), days, weeks };
}

export type BarMetrics =
  | { inWindow: true; left: number; width: number; pct: number; pctLabel: string }
  | { inWindow: false; rangeLabel: string };

export function computeBarMetrics(
  start: Date | null,
  end: Date | null,
  window: { start: Date; end: Date },
  referenceDate: Date,
): BarMetrics {
  const effStart = start ?? end!;
  const effEnd = end ?? start!;

  const barStartDay = Math.max(0, daysBetween(window.start, effStart));
  const barEndDay = Math.min(WINDOW_DAYS, daysBetween(window.start, effEnd) + 1);

  const rangeLabel = `${effStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${effEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  if (barEndDay <= 0 || barStartDay >= WINDOW_DAYS) {
    return { inWindow: false, rangeLabel };
  }

  const totalMs = effEnd.getTime() - effStart.getTime();
  let pct: number;
  if (totalMs <= 0) {
    pct = referenceDate >= effStart ? 100 : 0;
  } else if (referenceDate <= effStart) {
    pct = 0;
  } else if (referenceDate >= effEnd) {
    pct = 100;
  } else {
    pct = Math.round(((referenceDate.getTime() - effStart.getTime()) / totalMs) * 100);
  }

  return {
    inWindow: true,
    left: (barStartDay / WINDOW_DAYS) * 100,
    width: ((barEndDay - barStartDay) / WINDOW_DAYS) * 100,
    pct,
    pctLabel: `${pct}%`,
  };
}
