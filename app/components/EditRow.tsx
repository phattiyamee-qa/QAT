"use client";

import type { ProjectOverviewProject } from "@/lib/queries";

const fieldLabel: React.CSSProperties = {
  fontSize: 12,
  lineHeight: "16px",
  color: "var(--shopee-color-text-secondary)",
};

const fieldBox: React.CSSProperties = {
  height: 32,
  padding: "0 8px",
  border: "1px solid var(--shopee-color-border)",
  borderRadius: 4,
  fontFamily: "inherit",
  fontSize: 14,
  color: "var(--shopee-color-text)",
  background: "var(--shopee-color-bg-module)",
};

function fmtDate(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

// Read-only shell matching docs/design/EditRow.dc.html. Fields are
// pre-filled from the real record but not yet editable: the confirmed v1 QA
// write scope (period dates only) needs a logged-in QA session to know who
// is editing and to satisfy RLS, and Google OAuth isn't wired up yet — see
// lib/queries.ts. Phase 7 wires Save for real; this phase is the UI shell.
export function EditRow({
  project,
  onCancel,
}: {
  project: ProjectOverviewProject;
  onCancel: () => void;
}) {
  const uat = project.periods.find((p) => p.phase === "UAT");
  const live = project.periods.find((p) => p.phase === "LIVE");
  const qaNames = project.assignments
    .filter((a) => a.roleOnProject === "QA")
    .map((a) => a.person.name);

  return (
    <div
      style={{
        background: "var(--shopee-color-bg-module)",
        border: "1px solid var(--shopee-color-border)",
        borderRadius: 4,
        padding: 16,
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 120px 170px", gap: 12 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={fieldLabel}>Task name</span>
          <input type="text" defaultValue={project.title} disabled style={fieldBox} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={fieldLabel}>Priority</span>
          <select defaultValue={project.priority ?? ""} disabled style={fieldBox}>
            <option value="">–</option>
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={fieldLabel}>Status override</span>
          <select defaultValue={project.statusOverride?.status ?? "auto"} disabled style={fieldBox}>
            <option value="auto">Auto (from dates)</option>
            <option value="UAT">In UAT</option>
            <option value="LIVE">Live now</option>
            <option value="DONE">Done</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={fieldLabel}>QA assigned</span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              minHeight: 32,
              padding: "4px 8px",
              background: "var(--shopee-color-bg-module)",
              border: "1px solid var(--shopee-color-border)",
              borderRadius: 4,
            }}
          >
            {qaNames.length === 0 && (
              <span className="t-caption">No QA assigned</span>
            )}
            {qaNames.map((name) => (
              <span
                key={name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  height: 22,
                  padding: "0 8px",
                  borderRadius: 4,
                  background: "var(--shopee-color-white)",
                  border: "1px solid var(--shopee-color-border)",
                  fontSize: 12,
                  lineHeight: "16px",
                  color: "var(--shopee-color-text)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={fieldLabel}>Category</span>
          <input type="text" defaultValue={project.category} disabled style={fieldBox} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
        <div
          style={{
            background: "var(--shopee-color-white)",
            border: "1px solid var(--shopee-color-border)",
            borderRadius: 4,
            padding: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <span className="t-caption-strong">UAT phase</span>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ ...fieldLabel, color: "var(--shopee-color-text-tertiary)" }}>Start</span>
              <input type="date" defaultValue={fmtDate(uat?.startDate)} disabled style={fieldBox} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ ...fieldLabel, color: "var(--shopee-color-text-tertiary)" }}>Due</span>
              <input type="date" defaultValue={fmtDate(uat?.endDate)} disabled style={fieldBox} />
            </label>
          </div>
        </div>
        <div
          style={{
            background: "var(--shopee-color-white)",
            border: "1px solid var(--shopee-color-border)",
            borderRadius: 4,
            padding: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <span className="t-caption-strong">Live phase</span>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ ...fieldLabel, color: "var(--shopee-color-text-tertiary)" }}>Start</span>
              <input type="date" defaultValue={fmtDate(live?.startDate)} disabled style={fieldBox} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ ...fieldLabel, color: "var(--shopee-color-text-tertiary)" }}>Due</span>
              <input type="date" defaultValue={fmtDate(live?.endDate)} disabled style={fieldBox} />
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="button"
          disabled
          title="Editing lands once sign-in and the QA write path are wired up"
          style={{
            height: 32,
            padding: "0 16px",
            border: "none",
            borderRadius: 4,
            background: "var(--shopee-color-fill-secondary)",
            color: "var(--shopee-color-text-quaternary)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "not-allowed",
          }}
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: 32,
            padding: "0 16px",
            border: "1px solid var(--shopee-color-border)",
            borderRadius: 4,
            background: "var(--shopee-color-white)",
            color: "var(--shopee-color-text-secondary)",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <div style={{ flex: 1 }} />
        <span className="t-caption">Read-only preview — editing lands in a later phase</span>
      </div>
    </div>
  );
}
