export default function AddNewTaskPage() {
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
      <span className="t-section-title">Add New Task</span>
      <span className="t-body" style={{ color: "var(--shopee-color-text-secondary)" }}>
        Coming in a later build phase — manual task entry with multi-assignee search.
      </span>
    </div>
  );
}
