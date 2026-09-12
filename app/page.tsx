export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--shopee-padding-sm)",
        padding: "var(--shopee-padding-xl)",
      }}
    >
      <h1 className="t-page-title-xl">PMO Task Tracker</h1>
      <p className="t-body">
        Skeleton deploy — Project Overview, Track by Person, and Add New Task
        land in later build phases.
      </p>
    </main>
  );
}
