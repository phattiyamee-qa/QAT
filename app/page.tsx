import { getProjectOverviewData } from "@/lib/queries";
import { ProjectOverview } from "@/app/components/ProjectOverview";

// Live dashboard data, not a static page — never cache/prerender this.
export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjectOverviewData();
  return <ProjectOverview projects={projects} />;
}
