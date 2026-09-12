export default function TrackByPersonPage() {
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
      <span className="t-section-title">Track by Person</span>
      <span className="t-body" style={{ color: "var(--shopee-color-text-secondary)" }}>
        Coming in the next build phase — the 3-week rolling Gantt for UAT and Live.
      </span>
    </div>
  );
}
