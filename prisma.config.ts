import "dotenv/config";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma's CLI only auto-loads .env, not .env.local (that's a Next.js
// convention) - load it explicitly so there's one source of secrets, not two.
loadEnv({ path: path.join(__dirname, ".env.local") });

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
});
