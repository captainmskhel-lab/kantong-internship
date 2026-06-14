/**
 * migrate.ts — apply SQL migrations in db/migrations in filename order.
 * Usage: npm run db:migrate
 */
import { config as loadEnv } from "dotenv";
// Load .env.local first (Next.js convention), then .env as a fallback.
loadEnv({ path: ".env.local" });
loadEnv();
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "db", "migrations");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✖ DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }
  const ssl = /supabase\.(co|com)/.test(url) || /sslmode=require/.test(url) ? ("require" as const) : undefined;
  const sql = postgres(url, { max: 1, prepare: false, ssl });

  try {
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }
    for (const file of files) {
      const content = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      process.stdout.write(`→ applying ${file} ... `);
      await sql.unsafe(content);
      console.log("ok");
    }
    console.log("✓ Migrations applied.");
  } catch (err) {
    console.error("\n✖ Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
