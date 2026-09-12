# Supabase setup (build-sequence Phase 2)

## 1. Schema

Run the Prisma migration against your Supabase Postgres (needs `DATABASE_URL` /
`DIRECT_URL` in `.env.local` — see `.env.example`):

```bash
npx prisma migrate dev --name init
```

This creates `project`, `period`, `assignment`, `person`, `role`, and
`status_override` per `prisma/schema.prisma`.

## 2. RLS policies

After the migration above has created the tables, apply `rls-policies.sql`
— either paste it into the Supabase dashboard's SQL Editor, or:

```bash
psql "$DIRECT_URL" -f supabase/rls-policies.sql
```

See the comment header in that file for why RLS matters here (it's the real
enforcement for QA-facing reads/writes via `lib/supabase/*`, not just an
app-layer check — `lib/prisma.ts` connects as a privileged role and bypasses
RLS by design).

## 3. Google OAuth provider

Dashboard-only steps — nothing here for Claude Code to run:

1. **Google Cloud Console** → APIs & Services → Credentials → Create
   OAuth client ID (Web application).
   - Authorized redirect URI: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
   (find `[PROJECT_REF]` under Supabase Settings → API).
2. Copy the generated **Client ID** and **Client secret**.
3. **Supabase dashboard** → Authentication → Providers → Google → paste
   the Client ID/secret, enable the provider, save.
4. In the Next.js app, sign-in redirects to Supabase's Google OAuth flow;
   on callback, upsert a `person` row (matching by email if one already
   exists from a sheet sync, else create) and set `auth_user_id` — see
   `docs/data-model.md`'s note on the person/auth link.
