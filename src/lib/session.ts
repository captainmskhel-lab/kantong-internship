/**
 * session.ts — signed, HTTP-only session cookies (spec §3, §4).
 *
 * Two independent sessions:
 *   - admin  (treasurer)  signed with AUTH_SECRET
 *   - viewer (member PIN) signed with VIEWER_SESSION_SECRET, ~7 day lifetime
 *
 * Sessions are stateless JWTs (jose / HS256). They are validated server-side on
 * every protected request. Secrets never reach the browser.
 */
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "kantong_admin";
export const VIEWER_COOKIE = "kantong_viewer";

const VIEWER_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const ADMIN_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 days
const ADMIN_MAX_AGE_DEFAULT = 60 * 60 * 12; // 12 hours

export interface AdminSession {
  sub: string; // admin user id
  username: string;
  role: "admin";
}

export interface ViewerSession {
  role: "viewer";
}

function secretKey(value: string | undefined, name: string): Uint8Array {
  if (!value || value.length < 16) {
    throw new Error(`${name} is missing or too short. Set it in .env.local.`);
  }
  return new TextEncoder().encode(value);
}

function adminKey() {
  return secretKey(process.env.AUTH_SECRET, "AUTH_SECRET");
}
function viewerKey() {
  return secretKey(process.env.VIEWER_SESSION_SECRET, "VIEWER_SESSION_SECRET");
}

const isProd = process.env.NODE_ENV === "production";

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

// ---------------------------------------------------------------------------
// Admin session
// ---------------------------------------------------------------------------
export async function createAdminSession(
  payload: { id: string; username: string },
  remember: boolean,
): Promise<void> {
  const maxAge = remember ? ADMIN_MAX_AGE_REMEMBER : ADMIN_MAX_AGE_DEFAULT;
  const token = await new SignJWT({ username: payload.username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(adminKey());
  cookies().set(ADMIN_COOKIE, token, baseCookieOptions(maxAge));
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, adminKey());
    if (payload.role !== "admin" || !payload.sub) return null;
    return { sub: String(payload.sub), username: String(payload.username), role: "admin" };
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  cookies().set(ADMIN_COOKIE, "", { ...baseCookieOptions(0), maxAge: 0 });
}

// ---------------------------------------------------------------------------
// Viewer session
// ---------------------------------------------------------------------------
export async function createViewerSession(): Promise<void> {
  const token = await new SignJWT({ role: "viewer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${VIEWER_MAX_AGE}s`)
    .sign(viewerKey());
  cookies().set(VIEWER_COOKIE, token, baseCookieOptions(VIEWER_MAX_AGE));
}

export async function readViewerSession(): Promise<ViewerSession | null> {
  const token = cookies().get(VIEWER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, viewerKey());
    if (payload.role !== "viewer") return null;
    return { role: "viewer" };
  } catch {
    return null;
  }
}

export function clearViewerSession(): void {
  cookies().set(VIEWER_COOKIE, "", { ...baseCookieOptions(0), maxAge: 0 });
}
