/**
 * api.ts — server-side authorization guards & JSON helpers for route handlers.
 *
 * Every mutation endpoint must go through requireAdmin (spec §36.14). Viewer
 * endpoints go through requireViewer and return only redacted data.
 */
import "server-only";
import { NextResponse } from "next/server";
import { readAdminSession, readViewerSession, type AdminSession } from "./session";

export function jsonOk<T>(data: T, init?: number): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export const UNAUTHORIZED = jsonError("Akses ditolak. Silakan masuk lagi.", 401);
export const FORBIDDEN = jsonError("Kamu tidak punya akses untuk tindakan ini.", 403);

/** Resolve the admin session or null. */
export async function getAdmin(): Promise<AdminSession | null> {
  return readAdminSession();
}

/** Resolve a viewer (member) session or null. Admins also satisfy viewer reads. */
export async function getViewerOrAdmin(): Promise<"viewer" | "admin" | null> {
  const admin = await readAdminSession();
  if (admin) return "admin";
  const viewer = await readViewerSession();
  if (viewer) return "viewer";
  return null;
}

/**
 * Wrap an admin-only route handler. Returns 401 when not authenticated.
 */
export function withAdmin(
  handler: (ctx: { admin: AdminSession; req: Request }) => Promise<NextResponse>,
) {
  return async (req: Request): Promise<NextResponse> => {
    const admin = await readAdminSession();
    if (!admin) return UNAUTHORIZED;
    try {
      return await handler({ admin, req });
    } catch (err) {
      console.error("[api] admin handler error:", err);
      return jsonError("Terjadi kesalahan di server. Coba lagi.", 500);
    }
  };
}

/**
 * Wrap a read endpoint accessible to viewers OR admins. The handler receives the
 * resolved role so it can decide how much data to return.
 */
export function withViewer(
  handler: (ctx: { role: "viewer" | "admin"; req: Request }) => Promise<NextResponse>,
) {
  return async (req: Request): Promise<NextResponse> => {
    const role = await getViewerOrAdmin();
    if (!role) return UNAUTHORIZED;
    try {
      return await handler({ role, req });
    } catch (err) {
      console.error("[api] viewer handler error:", err);
      return jsonError("Terjadi kesalahan di server. Coba lagi.", 500);
    }
  };
}
