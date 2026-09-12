import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Runs queries as the signed-in user (via
// their session JWT), so RLS policies apply — this is the RLS-enforcing
// path for QA-facing reads/writes. Prisma (lib/prisma.ts) connects directly
// to Postgres as a privileged role and bypasses RLS entirely; it is only
// for migrations and privileged server-side jobs (e.g. the /api/sync webhook).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
