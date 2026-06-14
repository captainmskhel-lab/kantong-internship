/**
 * rate-limit.ts — login throttling (spec §4 "slow down repeated failed attempts").
 *
 * Backed by the login_attempts table so it works across serverless invocations.
 * Within a rolling window we cap failed attempts; once exceeded the caller is
 * asked to wait. Successful logins clear the counter for that identifier.
 */
import "server-only";
import { sql } from "./db";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 6;

export interface RateLimitState {
  blocked: boolean;
  remainingAttempts: number;
}

/** Derive a stable identifier from the request (best-effort client IP). */
export function clientIdentifier(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function checkRateLimit(identifier: string, scope: "admin" | "viewer"): Promise<RateLimitState> {
  const rows = await sql<{ failures: string }[]>`
    select count(*)::text as failures
    from login_attempts
    where identifier = ${identifier}
      and scope = ${scope}
      and successful = false
      and created_at > now() - (${WINDOW_MINUTES} || ' minutes')::interval
  `;
  const failures = Number(rows[0]?.failures ?? 0);
  return {
    blocked: failures >= MAX_FAILURES,
    remainingAttempts: Math.max(0, MAX_FAILURES - failures),
  };
}

export async function recordAttempt(
  identifier: string,
  scope: "admin" | "viewer",
  successful: boolean,
): Promise<void> {
  await sql`insert into login_attempts (identifier, scope, successful) values (${identifier}, ${scope}, ${successful})`;
  if (successful) {
    // Clear the failure streak for this identifier on success.
    await sql`delete from login_attempts where identifier = ${identifier} and scope = ${scope} and successful = false`;
  }
}
