/**
 * seed.ts — load db/seed.sql (16 members, categories, settings singleton).
 * Usage: npm run db:seed
 */
import { config as loadEnv } from "dotenv";
// Load .env.local first (Next.js convention), then .env as a fallback.
loadEnv({ path: ".env.local" });
loadEnv();
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✖ DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }
  const ssl = /supabase\.(co|com)/.test(url) || /sslmode=require/.test(url) ? ("require" as const) : undefined;
  const sql = postgres(url, { max: 1, prepare: false, ssl });
  try {
    const content = await readFile(join(__dirname, "..", "db", "seed.sql"), "utf8");
    await sql.unsafe(content);
    const [{ count }] = await sql<{ count: string }[]>`select count(*)::text as count from members`;
    console.log(`✓ Seed applied. Members in database: ${count}`);
  } catch (err) {
    console.error("✖ Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
