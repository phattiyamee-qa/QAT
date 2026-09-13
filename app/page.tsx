import net from "node:net";
import { getProjectOverviewData } from "@/lib/queries";
import { ProjectOverview } from "@/app/components/ProjectOverview";

// Live dashboard data, not a static page — never cache/prerender this.
export const dynamic = "force-dynamic";

function probeTcp(host: string, port: number): Promise<string> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 5000 });
    socket.on("connect", () => {
      resolve("TCP connect: OK");
      socket.destroy();
    });
    socket.on("timeout", () => {
      resolve("TCP connect: TIMEOUT");
      socket.destroy();
    });
    socket.on("error", (e) => {
      resolve(`TCP connect: ERROR ${(e as NodeJS.ErrnoException).code ?? e.message}`);
    });
  });
}

export default async function Home() {
  // TEMPORARY debug try/catch to see the real production error - remove once
  // the Vercel <-> Supabase connection issue is diagnosed.
  try {
    const projects = await getProjectOverviewData();
    return <ProjectOverview projects={projects} />;
  } catch (err) {
    const dbUrl = process.env.DATABASE_URL ?? "";
    const masked = dbUrl.replace(/:\/\/([^:]+):[^@]+@/, "://$1:***@");
    const hostMatch = dbUrl.match(/@([^:/]+):(\d+)/);
    const tcpResult = hostMatch
      ? await probeTcp(hostMatch[1], Number(hostMatch[2]))
      : "no host parsed from DATABASE_URL";

    return (
      <pre style={{ whiteSpace: "pre-wrap", padding: 16, background: "#fff", color: "#900" }}>
        {`DATABASE_URL (masked): ${masked}\n${tcpResult}\n\n`}
        {err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err)}
      </pre>
    );
  }
}
