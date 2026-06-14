/**
 * db.ts — server-only Postgres client (postgres.js) against DATABASE_URL.
 *
 * The client is created lazily on first query so that importing this module
 * (e.g. during `next build` static analysis) never fails when env vars are
 * absent. The Supabase service-role key and database URL stay on the server.
 */

import "server-only";
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __kantong_sql: Sql | undefined;
}

/** Supabase (and most managed Postgres) require TLS; local Postgres usually doesn't. */
export function sslForUrl(url: string): "require" | undefined {
  return /supabase\.(co|com)/.test(url) || /sslmode=require/.test(url) ? "require" : undefined;
}

function createClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection string.",
    );
  }
  return postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false, // compatible with Supabase transaction pooler
    ssl: sslForUrl(url),
  });
}

function client(): Sql {
  if (!global.__kantong_sql) {
    global.__kantong_sql = createClient();
  }
  return global.__kantong_sql;
}

/**
 * Lazy proxy that behaves exactly like the postgres.js `sql` tag:
 *  - sql`select ...`        → apply trap
 *  - sql.begin / json / ... → get trap (bound to the real client)
 */
export const sql = new Proxy(function () {} as unknown as Sql, {
  apply(_target, _thisArg, args: unknown[]) {
    return (client() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    const c = client() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(c) : value;
  },
}) as Sql;
