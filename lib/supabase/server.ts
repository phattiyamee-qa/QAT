import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for Server Components / Server Actions / Route
// Handlers. Reads the user's session from cookies, so queries run as the
// `authenticated` Postgres role and RLS policies apply — use this (not
// lib/prisma.ts) for anything a QA user's own session should be allowed to
// do, so the DB — not just app code — enforces who can see/edit what.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore when
            // middleware is refreshing the session.
          }
        },
      },
    },
  );
}
