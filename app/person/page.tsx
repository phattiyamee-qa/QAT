import { getProjectOverviewData } from "@/lib/queries";
import { TrackByPerson } from "@/app/components/TrackByPerson";

// Live dashboard data, not a static page — never cache/prerender this.
export const dynamic = "force-dynamic";

export default async function TrackByPersonPage() {
  const projects = await getProjectOverviewData();
  return <TrackByPerson projects={projects} />;
}
