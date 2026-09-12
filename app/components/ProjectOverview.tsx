"use client";

import { useMemo, useState } from "react";
import type { ProjectOverviewProject } from "@/lib/queries";
import { computeStatusKey, isInProgress, statCategory, statusVisual, type StatCategory } from "@/lib/status";
import { EditRow } from "@/app/components/EditRow";

const AVATAR_PALETTE = [
  "var(--shopee-chart-1)",
  "var(--shopee-chart-2)",
  "var(--shopee-chart-3)",
  "var(--shopee-chart-4)",
  "var(--shopee-chart-5)",
  "var(--shopee-chart-6)",
  "var(--shopee-chart-7)",
  "var(--shopee-chart-8)",
  "var(--shopee-chart-9)",
  "var(--shopee-chart-10)",
];

function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function fmtRange(start: Date | null | undefined, end: Date | null | undefined) {
  const f = (d: Date) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!start && !end) return "–";
  if (start && end) return `${f(start)} – ${f(end)}`;
  return f((start ?? end)!);
}

const PRIORITY_STYLE: Record<string, { bg: string; fg: string }> = {
  P0: { bg: "var(--shopee-color-error-bg)", fg: "var(--shopee-color-error)" },
  P1: { bg: "var(--shopee-color-warning-bg-strong)", fg: "var(--shopee-color-warning-icon)" },
  P2: { bg: "var(--shopee-color-info-bg)", fg: "var(--shopee-color-info)" },
  P3: { bg: "var(--shopee-color-fill-tertiary)", fg: "var(--shopee-color-text-secondary)" },
};

const STAT_CARDS: { key: StatCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "not_started", label: "Not started" },
  { key: "pending_live", label: "UAT done – waiting Live" },
  { key: "live", label: "Live now" },
  { key: "done", label: "Done" },
  { key: "no_timeline", label: "No timeline" },
  { key: "skipped", label: "Skipped" },
];

const STAT_BAR_COLOR: Record<Exclude<StatCategory, "all">, string> = {
  not_started: "var(--shopee-color-fill)",
  pending_live: "var(--shopee-tag-warning-text)",
  live: "var(--shopee-tag-success-text)",
  done: "var(--shopee-color-text-tertiary)",
  no_timeline: "var(--shopee-color-border)",
  skipped: "var(--shopee-color-text-quaternary)",
};

export function ProjectOverview({ projects }: { projects: ProjectOverviewProject[] }) {
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedStat, setSelectedStat] = useState<StatCategory>("all");
  const [inProgressOnly, setInProgressOnly] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string> | null>(null); // null = all open
  const [editingId, setEditingId] = useState<string | null>(null);

  const refDateObj = useMemo(() => new Date(referenceDate + "T00:00:00"), [referenceDate]);

  const enriched = useMemo(
    () =>
      projects.map((p) => {
        const key = computeStatusKey(p.periods, p.statusOverride?.status, refDateObj);
        return { project: p, statusKey: key, statCategory: statCategory(key) };
      }),
    [projects, refDateObj],
  );

  const allCategories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category))).sort(),
    [projects],
  );

  const statCounts = useMemo(() => {
    const counts: Record<StatCategory, number> = {
      all: enriched.length,
      not_started: 0,
      pending_live: 0,
      live: 0,
      done: 0,
      no_timeline: 0,
      skipped: 0,
    };
    for (const e of enriched) counts[e.statCategory]++;
    return counts;
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ project, statusKey, statCategory: cat }) => {
      if (selectedStat !== "all" && cat !== selectedStat) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(project.category)) return false;
      if (inProgressOnly && !isInProgress(statusKey)) return false;
      if (q) {
        const inTitle = project.title.toLowerCase().includes(q);
        const inAssignee = project.assignments.some((a) => a.person.name.toLowerCase().includes(q));
        if (!inTitle && !inAssignee) return false;
      }
      return true;
    });
  }, [enriched, selectedStat, selectedCategories, inProgressOnly, search]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const list = byCategory.get(item.project.category) ?? [];
      list.push(item);
      byCategory.set(item.project.category, list);
    }
    return Array.from(byCategory.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function toggleCategoryChip(cat: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleCategoryOpen(cat: string) {
    setOpenCategories((prev) => {
      const base = prev ?? new Set(allCategories);
      const next = new Set(base);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function isCategoryOpen(cat: string) {
    return openCategories === null || openCategories.has(cat);
  }

  const overviewSub = `${enriched.length} project${enriched.length === 1 ? "" : "s"} synced from the Sheet`;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-page-title">Project Overview</div>
          <div className="t-caption" style={{ marginTop: 4 }}>
            {overviewSub}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 32,
            padding: "0 8px",
            background: "var(--shopee-color-white)",
            border: "1px solid var(--shopee-color-border)",
            borderRadius: 4,
          }}
        >
          <span className="t-caption">Reference date</span>
          <input
            type="date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
            style={{ height: 24, border: "none", outline: "none", fontSize: 14, color: "var(--shopee-color-text)", background: "transparent" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 12 }}>
        {STAT_CARDS.map((s) => {
          const active = selectedStat === s.key;
          const dotColor = s.key === "all" ? "var(--shopee-color-text-tertiary)" : STAT_BAR_COLOR[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSelectedStat(s.key)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                padding: 12,
                background: active ? "var(--shopee-color-primary-bg)" : "var(--shopee-color-white)",
                border: `1px solid ${active ? "var(--shopee-color-primary-border)" : "var(--shopee-color-border)"}`,
                borderRadius: 8,
                boxShadow: "var(--shopee-shadow-sm)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
                <span className="t-page-title">{statCounts[s.key]}</span>
              </span>
              <span className="t-caption">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: "var(--shopee-color-white)",
          borderRadius: 8,
          boxShadow: "var(--shopee-shadow-sm)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 32,
              padding: "0 8px",
              border: "1px solid var(--shopee-color-border)",
              borderRadius: 4,
              minWidth: 280,
              flex: "0 1 320px",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project title or assignee"
              style={{ flex: 1, height: 24, border: "none", outline: "none", fontSize: 14, color: "var(--shopee-color-text)", background: "transparent" }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setInProgressOnly((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 32,
              padding: "0 12px",
              border: `1px solid ${inProgressOnly ? "var(--shopee-color-primary-border)" : "var(--shopee-color-border)"}`,
              borderRadius: 4,
              background: inProgressOnly ? "var(--shopee-color-primary-bg)" : "var(--shopee-color-white)",
              color: inProgressOnly ? "var(--shopee-color-primary-text-active)" : "var(--shopee-color-text-secondary)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 28,
                height: 16,
                borderRadius: 8,
                background: inProgressOnly ? "var(--shopee-color-primary)" : "var(--shopee-color-fill-secondary)",
                position: "relative",
                flex: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: inProgressOnly ? 14 : 2,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "var(--shopee-color-white)",
                }}
              />
            </span>
            In progress only
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {allCategories.map((cat) => {
            const active = selectedCategories.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategoryChip(cat)}
                style={{
                  height: 28,
                  padding: "0 12px",
                  border: `1px solid ${active ? "var(--shopee-color-primary)" : "var(--shopee-color-border)"}`,
                  borderRadius: 4,
                  background: active ? "var(--shopee-color-primary-bg)" : "var(--shopee-color-white)",
                  color: active ? "var(--shopee-color-primary-text-active)" : "var(--shopee-color-text-secondary)",
                  fontSize: 12,
                  lineHeight: "16px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div
          style={{
            background: "var(--shopee-color-white)",
            borderRadius: 8,
            boxShadow: "var(--shopee-shadow-sm)",
            padding: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="t-section-title">
            {projects.length === 0 ? "No projects yet" : "No projects match these filters"}
          </span>
          <span className="t-body" style={{ color: "var(--shopee-color-text-secondary)" }}>
            {projects.length === 0
              ? "Projects will appear here once the Sheet sync runs, or a task is added manually."
              : "Clear the search, the category chips, or the status card to see the full list."}
          </span>
          {projects.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategories(new Set());
                setSelectedStat("all");
              }}
              style={{
                marginTop: 8,
                height: 32,
                padding: "0 16px",
                border: "1px solid var(--shopee-color-primary)",
                borderRadius: 4,
                background: "var(--shopee-color-white)",
                color: "var(--shopee-color-primary)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grouped.map(([category, items]) => {
            const dist = new Map<string, number>();
            for (const item of items) dist.set(item.statCategory, (dist.get(item.statCategory) ?? 0) + 1);
            const total = items.length;

            return (
              <section
                key={category}
                style={{ background: "var(--shopee-color-white)", borderRadius: 8, boxShadow: "var(--shopee-shadow-sm)", overflow: "hidden" }}
              >
                <button
                  type="button"
                  onClick={() => toggleCategoryOpen(category)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "var(--shopee-color-bg-module)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--shopee-color-text-secondary)" }}>
                    {isCategoryOpen(category) ? "▾" : "▸"}
                  </span>
                  <span className="t-section-title">{category}</span>
                  <span className="t-caption">{total} project{total === 1 ? "" : "s"}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ display: "flex", height: 8, width: 220, borderRadius: 4, overflow: "hidden", background: "var(--shopee-color-fill-tertiary)" }}>
                    {Array.from(dist.entries()).map(([cat, count]) => (
                      <span
                        key={cat}
                        title={`${cat}: ${count}`}
                        style={{
                          height: 8,
                          width: `${(count / total) * 100}%`,
                          background: STAT_BAR_COLOR[cat as Exclude<StatCategory, "all">],
                        }}
                      />
                    ))}
                  </span>
                </button>

                {isCategoryOpen(category) && (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1fr) 56px 132px 148px 148px 196px 32px",
                        gap: 12,
                        padding: "8px 16px",
                        background: "var(--shopee-color-white)",
                        borderBottom: "1px solid var(--shopee-color-border-secondary)",
                        fontSize: 12,
                        lineHeight: "16px",
                        color: "var(--shopee-color-text-tertiary)",
                      }}
                    >
                      <span>Project</span>
                      <span>Priority</span>
                      <span>QA</span>
                      <span>UAT</span>
                      <span>Live</span>
                      <span>Status</span>
                      <span />
                    </div>
                    {items.map(({ project, statusKey }) => {
                      const uat = project.periods.find((p) => p.phase === "UAT");
                      const live = project.periods.find((p) => p.phase === "LIVE");
                      const qaAssignees = project.assignments.filter((a) => a.roleOnProject === "QA");
                      const prio = PRIORITY_STYLE[project.priority ?? ""] ?? PRIORITY_STYLE.P3;
                      const visual = statusVisual(statusKey);
                      const isEditing = editingId === project.id;

                      return (
                        <div key={project.id} style={{ borderBottom: "1px solid var(--shopee-color-border-secondary)" }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(0,1fr) 56px 132px 148px 148px 196px 32px",
                              gap: 12,
                              padding: "10px 16px",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div className="t-body-strong" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {project.title}
                              </div>
                              {project.remark && (
                                <div className="t-caption" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {project.remark}
                                </div>
                              )}
                            </div>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: 20,
                                padding: "0 6px",
                                borderRadius: 4,
                                background: prio.bg,
                                color: prio.fg,
                                fontSize: 12,
                                fontWeight: 500,
                                justifySelf: "start",
                              }}
                            >
                              {project.priority ?? "–"}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              {qaAssignees.length === 0 && <span className="t-caption">–</span>}
                              {qaAssignees.map((a) => (
                                <span
                                  key={a.personId}
                                  title={a.person.name}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    background: avatarColor(a.personId),
                                    color: "var(--shopee-color-white)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  {initials(a.person.name)}
                                </span>
                              ))}
                            </div>
                            <span className="t-caption" style={{ justifySelf: "start" }}>
                              {fmtRange(uat?.startDate, uat?.endDate)}
                            </span>
                            <span className="t-caption" style={{ justifySelf: "start" }}>
                              {fmtRange(live?.startDate, live?.endDate)}
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                height: 24,
                                padding: "0 8px",
                                borderRadius: 4,
                                background: visual.bg,
                                border: visual.border,
                                fontSize: 12,
                                color: "var(--shopee-color-text)",
                                justifySelf: "start",
                              }}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: visual.dot, border: visual.dotBorder }} />
                              {visual.label}
                            </span>
                            <button
                              type="button"
                              title="Edit task"
                              onClick={() => setEditingId(isEditing ? null : project.id)}
                              style={{
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1px solid ${isEditing ? "var(--shopee-color-primary)" : "var(--shopee-color-border)"}`,
                                borderRadius: 4,
                                background: "var(--shopee-color-white)",
                                color: isEditing ? "var(--shopee-color-primary)" : "var(--shopee-color-text-secondary)",
                                cursor: "pointer",
                              }}
                            >
                              ✎
                            </button>
                          </div>
                          {isEditing && (
                            <div style={{ padding: "0 16px 16px" }}>
                              <EditRow project={project} onCancel={() => setEditingId(null)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
