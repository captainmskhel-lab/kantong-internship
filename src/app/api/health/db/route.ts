import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * TEMPORARY admin-safe database diagnostics for production debugging.
 *
 * Returns ONLY booleans + a sanitized error code/message. It never returns any
 * secret value — no DATABASE_URL, Supabase keys, passwords, or tokens. Remove
 * this route once production connectivity is confirmed.
 *
 * Must run on the Node.js runtime (postgres.js uses Node TCP sockets, which the
 * Edge runtime does not support).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function present(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

/** Build a safe error code + short message that can never leak a connection string. */
function safeError(err: unknown): { errorCode: string; errorMessage: string } {
  const e = err as { code?: unknown; name?: unknown; message?: unknown };
  const code = String(e?.code ?? e?.name ?? "UNKNOWN").slice(0, 48);
  let message = String(e?.message ?? "Unknown error");
  // Defence in depth: strip anything resembling a URL / credentials, then cap length.
  message = message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/\/\/[^@\s]+@/g, "//[redacted]@")
    .slice(0, 200);
  return { errorCode: code, errorMessage: message };
}

export async function GET() {
  const result = {
    databaseUrlPresent: present("DATABASE_URL"),
    supabaseUrlPresent: present("NEXT_PUBLIC_SUPABASE_URL"),
    anonKeyPresent: present("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKeyPresent: present("SUPABASE_SERVICE_ROLE_KEY"),
    canConnectDatabase: false,
    canReadAppSettings: false,
    setupCompleted: null as boolean | null,
    errorCode: "",
    errorMessage: "",
    checkedAt: new Date().toISOString(),
  };

  try {
    // 1) Can we open a connection and run a trivial query?
    await sql`select 1 as ok`;
    result.canConnectDatabase = true;

    // 2) Can we read the settings singleton, and is setup complete?
    try {
      const rows = await sql<{ setup_completed: boolean }[]>`select setup_completed from app_settings limit 1`;
      result.canReadAppSettings = true;
      result.setupCompleted = rows[0] ? Boolean(rows[0].setup_completed) : null;
    } catch (err) {
      const { errorCode, errorMessage } = safeError(err);
      result.errorCode = errorCode;
      result.errorMessage = errorMessage;
    }
  } catch (err) {
    const { errorCode, errorMessage } = safeError(err);
    result.errorCode = errorCode;
    result.errorMessage = errorMessage;
  }

  // Always 200 so the JSON is readable even when the database is unreachable.
  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
