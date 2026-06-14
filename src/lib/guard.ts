/**
 * guard.ts — server-component access guards (spec §3, §4, §36.14).
 * Use at the top of protected layouts/pages. Redirects when unauthenticated.
 */
import "server-only";
import { redirect } from "next/navigation";
import { readAdminSession, readViewerSession, type AdminSession } from "./session";
import { isSetupCompleted } from "./repo";

export async function requireAdminPage(): Promise<AdminSession> {
  const admin = await readAdminSession();
  if (!admin) redirect("/masuk-bendahara");
  return admin;
}

export async function requireViewerPage(): Promise<"viewer" | "admin"> {
  const admin = await readAdminSession();
  if (admin) return "admin";
  const viewer = await readViewerSession();
  if (!viewer) redirect("/masuk-anggota");
  return "viewer";
}

/** Returns true when the app still needs first-time setup. */
export async function needsSetup(): Promise<boolean> {
  try {
    return !(await isSetupCompleted());
  } catch {
    // If the DB is unreachable we cannot prove setup is done — send to setup.
    return true;
  }
}
