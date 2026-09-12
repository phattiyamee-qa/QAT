import { prisma } from "@/lib/prisma";

// Reads all projects via Prisma's direct connection (bypasses RLS) rather
// than the session-scoped Supabase client. Temporary: Google OAuth login
// isn't wired up yet (docs/design/README.md, supabase/README.md §3), so
// there's no user session to scope by. Once login exists, Project Overview
// should switch to lib/supabase/server.ts so RLS actually filters by
// assignment for a real logged-in QA user — this is a known, flagged gap,
// not an oversight.
export async function getProjectOverviewData() {
  const projects = await prisma.project.findMany({
    include: {
      periods: true,
      assignments: { include: { person: true } },
      statusOverride: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return projects;
}

export type ProjectOverviewProject = Awaited<ReturnType<typeof getProjectOverviewData>>[number];
