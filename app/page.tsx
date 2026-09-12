import { getProjectOverviewData } from "@/lib/queries";
import { ProjectOverview } from "@/app/components/ProjectOverview";

// Live dashboard data, not a static page — never cache/prerender this.
export const dynamic = "force-dynamic";

export default async function Home() {
  // TEMPORARY debug try/catch to see the real production error - remove once
  // the Vercel <-> Supabase connection issue is diagnosed.
  try {
    const projects = await getProjectOverviewData();
    return <ProjectOverview projects={projects} />;
  } catch (err) {
    return (
      <pre style={{ whiteSpace: "pre-wrap", padding: 16, background: "#fff", color: "#900" }}>
        {err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err)}
      </pre>
    );
  }
}
