"use client";

import { useMemo, useState } from "react";
import type { ProjectOverviewProject } from "@/lib/queries";
import { computeStatusKey } from "@/lib/status";
import { priorityStyle } from "@/lib/priority";
import { buildWindow, computeBarMetrics } from "@/lib/gantt";
import { EditRow } from "@/app/components/EditRow";

const PHASES = [
  { phase: "UAT" as const, title: "UAT", color: "var(--shopee-color-info)", tint: "var(--shopee-color-info-bg)" },
  { phase: "LIVE" as const, title: "Live", color: "var(--shopee-tag-success-text)", tint: "var(--shopee-tag-success-bg)" },
];

function fmtRange(start: Date | null | undefined, end: Date | null | undefined) {
  const f = (d: Date) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!start && !end) return "–";
  if (start && end) return `${f(start)} – ${f(end)}`;
  return f((start ?? end)!);
}

function WeekNav({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const btn: React.CSSProperties = {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--shopee-color-border)",
    background: "var(--shopee-color-white)",
    color: "var(--shopee-color-text-secondary)",
    cursor: "pointer",
  };
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button type="button" title="Previous week" onClick={onPrev} style={{ ...btn, borderRadius: "4px 0 0 4px" }}>
        ‹
      </button>
      <button type="button" title="Next week" onClick={onNext} style={{ ...btn, borderLeft: "none", borderRadius: "0 4px 4px 0" }}>
        ›
      </button>
    </div>
  );
}

export function TrackByPerson({ projects }: { projects: ProjectOverviewProject[] }) {
  const allPeople = useMemo(() => {
    const names = new Set<string>();
    for (const p of projects) for (const a of p.assignments) names.add(a.person.name);
    return Array.from(names).sort();
  }, [projects]);

  const [person, setPerson] = useState<string | null>(allPeople[0] ?? null);
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weekOffset, setWeekOffset] = useState({ UAT: 0, LIVE: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const refDateObj = useMemo(() => new Date(referenceDate + "T00:00:00"), [referenceDate]);

  function shiftRefDate(days: number) {
    setReferenceDate((d) => new Date(new Date(d + "T00:00:00").getTime() + days * 86400000).toISOString().slice(0, 10));
    setWeekOffset({ UAT: 0, LIVE: 0 });
  }

  const personProjects = useMemo(
    () => (person ? projects.filter((p) => p.assignments.some((a) => a.person.name === person)) : []),
    [projects, person],
  );

  const buckets = useMemo(() => {
    const gantt: Record<"UAT" | "LIVE", ProjectOverviewProject[]> = { UAT: [], LIVE: [] };
    const noTimeline: ProjectOverviewProject[] = [];
    const done: ProjectOverviewProject[] = [];
    const skipped: ProjectOverviewProject[] = [];

    for (const project of personProjects) {
      const key = computeStatusKey(project.periods, project.statusOverride?.status, refDateObj);
      if (key === "done") {
        done.push(project);
        continue;
      }
      if (key === "skipped") {
        skipped.push(project);
        continue;
      }
      const uat = project.periods.find((p) => p.phase === "UAT");
      const live = project.periods.find((p) => p.phase === "LIVE");
      const hasUat = !!(uat?.startDate || uat?.endDate);
      const hasLive = !!(live?.startDate || live?.endDate);
      if (!hasUat && !hasLive) {
        noTimeline.push(project);
        continue;
      }
      if (hasUat) gantt.UAT.push(project);
      if (hasLive) gantt.LIVE.push(project);
    }

    const byPriority = (a: ProjectOverviewProject, b: ProjectOverviewProject) =>
      (a.priority ?? "P9").localeCompare(b.priority ?? "P9");
    gantt.UAT.sort(byPriority);
    gantt.LIVE.sort(byPriority);
    noTimeline.sort(byPriority);
    done.sort(byPriority);
    skipped.sort(byPriority);

    return { gantt, noTimeline, done, skipped };
  }, [personProjects, refDateObj]);

  if (!person) {
    return (
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
        <span className="t-section-title">No one assigned yet</span>
        <span className="t-body" style={{ color: "var(--shopee-color-text-secondary)" }}>
          Assignees will show up here once projects sync from the Sheet or a task is added manually.
        </span>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-page-title">Track by Person</div>
          <div className="t-caption" style={{ marginTop: 4 }}>
            {personProjects.length} project{personProjects.length === 1 ? "" : "s"} assigned to {person}
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="t-caption">Person</span>
          <select
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            style={{ height: 32, minWidth: 180, padding: "0 8px", border: "1px solid var(--shopee-color-border)", borderRadius: 4, fontSize: 14, color: "var(--shopee-color-text)", background: "var(--shopee-color-white)" }}
          >
            {allPeople.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        style={{
          background: "var(--shopee-color-white)",
          borderRadius: 8,
          boxShadow: "var(--shopee-shadow-sm)",
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span className="t-body-strong">Reference date</span>
        <span className="t-caption">Every percentage on this page is measured against it.</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            type="button"
            title="Previous day"
            onClick={() => shiftRefDate(-1)}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--shopee-color-border)", borderRadius: "4px 0 0 4px", background: "var(--shopee-color-white)", color: "var(--shopee-color-text-secondary)", cursor: "pointer" }}
          >
            ‹
          </button>
          <input
            type="date"
            value={referenceDate}
            onChange={(e) => {
              setReferenceDate(e.target.value);
              setWeekOffset({ UAT: 0, LIVE: 0 });
            }}
            style={{ height: 32, padding: "0 8px", border: "1px solid var(--shopee-color-border)", borderLeft: "none", borderRight: "none", fontSize: 14, color: "var(--shopee-color-text)", background: "var(--shopee-color-white)" }}
          />
          <button
            type="button"
            title="Next day"
            onClick={() => shiftRefDate(1)}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--shopee-color-border)", borderRadius: "0 4px 4px 0", background: "var(--shopee-color-white)", color: "var(--shopee-color-text-secondary)", cursor: "pointer" }}
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setReferenceDate(new Date().toISOString().slice(0, 10));
            setWeekOffset({ UAT: 0, LIVE: 0 });
          }}
          style={{ height: 32, padding: "0 16px", border: "1px solid var(--shopee-color-primary)", borderRadius: 4, background: "var(--shopee-color-white)", color: "var(--shopee-color-primary)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
        >
          Today
        </button>
      </div>

      {PHASES.map(({ phase, title, color, tint }) => {
        const rows = buckets.gantt[phase];
        const window = buildWindow(refDateObj, weekOffset[phase]);
        const windowLabel = `${window.days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${window.days[20].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

        return (
          <section key={phase} style={{ background: "var(--shopee-color-white)", borderRadius: 8, boxShadow: "var(--shopee-shadow-sm)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--shopee-color-border-secondary)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span className="t-section-title">{title}</span>
              <span className="t-caption">
                {rows.length} task{rows.length === 1 ? "" : "s"}
              </span>
              <div style={{ flex: 1 }} />
              <span className="t-caption">{windowLabel}</span>
              <WeekNav
                onPrev={() => setWeekOffset((w) => ({ ...w, [phase]: w[phase] - 1 }))}
                onNext={() => setWeekOffset((w) => ({ ...w, [phase]: w[phase] + 1 }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", borderBottom: "1px solid var(--shopee-color-border-secondary)", background: "var(--shopee-color-bg-module)" }}>
              <div style={{ padding: "6px 16px", fontSize: 12, color: "var(--shopee-color-text-tertiary)" }}>Task</div>
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
                  {window.weeks.map((w, i) => (
                    <div key={i} style={{ padding: "6px 8px", fontSize: 12, fontWeight: 500, color: "var(--shopee-color-text-secondary)", borderLeft: "1px solid var(--shopee-color-border)" }}>
                      {w.label}
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(21,1fr)" }}>
                  {window.days.map((d, i) => {
                    const isToday = d.toDateString() === refDateObj.toDateString();
                    return (
                      <div key={i} style={{ padding: "2px 0 4px", textAlign: "center", borderLeft: "1px solid var(--shopee-color-border-secondary)", background: isToday ? "var(--shopee-color-primary-bg)" : "transparent" }}>
                        <div style={{ fontSize: 10, color: "var(--shopee-color-text-tertiary)" }}>{d.toLocaleDateString(undefined, { weekday: "narrow" })}</div>
                        <div style={{ fontSize: 11, fontWeight: isToday ? 600 : 400, color: isToday ? "var(--shopee-color-primary)" : "var(--shopee-color-text-secondary)" }}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {rows.length === 0 ? (
              <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span className="t-body-strong">No {title} tasks</span>
                <span className="t-caption">Tasks with {title} dates for {person} will show up here.</span>
              </div>
            ) : (
              rows.map((project) => {
                const p = project.periods.find((pp) => pp.phase === phase)!;
                const metrics = computeBarMetrics(p.startDate, p.endDate, window, refDateObj);
                const prio = priorityStyle(project.priority);
                const isEditing = editingId === `${phase}-${project.id}`;
                return (
                  <div key={project.id} style={{ borderBottom: "1px solid var(--shopee-color-border-secondary)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", alignItems: "center", minHeight: 40 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", minWidth: 0 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 18, padding: "0 5px", borderRadius: 4, background: prio.bg, color: prio.fg, fontSize: 11, fontWeight: 500, flex: "none" }}>
                          {project.priority ?? "–"}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--shopee-color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title}</span>
                        <div style={{ flex: 1 }} />
                        <button
                          type="button"
                          title="Edit task"
                          onClick={() => setEditingId(isEditing ? null : `${phase}-${project.id}`)}
                          style={{ width: 24, height: 24, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isEditing ? "var(--shopee-color-primary)" : "var(--shopee-color-border)"}`, borderRadius: 4, background: "var(--shopee-color-white)", color: isEditing ? "var(--shopee-color-primary)" : "var(--shopee-color-text-secondary)", cursor: "pointer" }}
                        >
                          ✎
                        </button>
                      </div>
                      <div style={{ position: "relative", height: 28 }}>
                        {metrics.inWindow ? (
                          <div style={{ position: "absolute", top: 3, height: 22, borderRadius: 4, left: `${metrics.left}%`, width: `${metrics.width}%`, background: tint, overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "var(--shopee-color-text)" }}>
                              {metrics.pctLabel}
                            </div>
                            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${metrics.pct}%`, background: color, overflow: "hidden" }}>
                              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "var(--shopee-color-white)" }}>
                                {metrics.pctLabel}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ position: "absolute", top: 6, left: 8, fontSize: 11, color: "var(--shopee-color-text-quaternary)" }}>
                            {metrics.rangeLabel} · outside this range
                          </div>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <div style={{ padding: "0 16px 16px" }}>
                        <EditRow project={project} onCancel={() => setEditingId(null)} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        );
      })}

      <section style={{ background: "var(--shopee-color-white)", borderRadius: 8, boxShadow: "var(--shopee-shadow-sm)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--shopee-color-border-secondary)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "transparent", border: "1px dashed var(--shopee-color-text-tertiary)" }} />
          <span className="t-section-title">No timeline yet</span>
          <span className="t-caption">{buckets.noTimeline.length}</span>
        </div>
        {buckets.noTimeline.length === 0 ? (
          <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span className="t-body-strong">Every task has dates</span>
            <span className="t-caption">Tasks with no UAT or Live dates would be listed here.</span>
          </div>
        ) : (
          buckets.noTimeline.map((project) => {
            const prio = priorityStyle(project.priority);
            const isEditing = editingId === `notimeline-${project.id}`;
            return (
              <div key={project.id} style={{ borderBottom: "1px solid var(--shopee-color-border-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 18, padding: "0 5px", borderRadius: 4, background: prio.bg, color: prio.fg, fontSize: 11, fontWeight: 500 }}>
                    {project.priority ?? "–"}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--shopee-color-text)" }}>{project.title}</span>
                  <span className="t-caption">{project.category}</span>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : `notimeline-${project.id}`)}
                    style={{ height: 28, padding: "0 12px", border: "1px dashed var(--shopee-color-primary)", borderRadius: 4, background: "var(--shopee-color-white)", color: "var(--shopee-color-primary)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                  >
                    Set timeline
                  </button>
                </div>
                {isEditing && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <EditRow project={project} onCancel={() => setEditingId(null)} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        {[
          { key: "done", title: "Done", color: "var(--shopee-color-text-tertiary)", rows: buckets.done, deco: "none" },
          { key: "skipped", title: "Skipped", color: "var(--shopee-color-text-quaternary)", rows: buckets.skipped, deco: "line-through" },
        ].map((sec) => (
          <section key={sec.key} style={{ background: "var(--shopee-color-white)", borderRadius: 8, boxShadow: "var(--shopee-shadow-sm)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--shopee-color-border-secondary)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: sec.color }} />
              <span className="t-section-title">{sec.title}</span>
              <span className="t-caption">{sec.rows.length}</span>
            </div>
            {sec.rows.length === 0 ? (
              <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span className="t-body-strong">Nothing here</span>
                <span className="t-caption">Tasks marked {sec.title.toLowerCase()} will show up here.</span>
              </div>
            ) : (
              sec.rows.map((project) => {
                const prio = priorityStyle(project.priority);
                const uat = project.periods.find((p) => p.phase === "UAT");
                const live = project.periods.find((p) => p.phase === "LIVE");
                const isEditing = editingId === `${sec.key}-${project.id}`;
                return (
                  <div key={project.id} style={{ borderBottom: "1px solid var(--shopee-color-border-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 18, padding: "0 5px", borderRadius: 4, background: prio.bg, color: prio.fg, fontSize: 11, fontWeight: 500 }}>
                        {project.priority ?? "–"}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--shopee-color-text)", textDecoration: sec.deco, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {project.title}
                      </span>
                      <div style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, color: "var(--shopee-color-text-tertiary)" }}>{fmtRange(uat?.startDate, live?.endDate ?? uat?.endDate)}</span>
                      <button
                        type="button"
                        title="Edit task"
                        onClick={() => setEditingId(isEditing ? null : `${sec.key}-${project.id}`)}
                        style={{ width: 24, height: 24, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isEditing ? "var(--shopee-color-primary)" : "var(--shopee-color-border)"}`, borderRadius: 4, background: "var(--shopee-color-white)", color: isEditing ? "var(--shopee-color-primary)" : "var(--shopee-color-text-secondary)", cursor: "pointer" }}
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
              })
            )}
          </section>
        ))}
      </div>
    </>
  );
}
