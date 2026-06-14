import { jsonOk, withViewer } from "@/lib/api";
import { adminSearch, viewerSearch } from "@/lib/service";

export const runtime = "nodejs";

/**
 * Global search. Accessible to both treasurer and member sessions, but scoped
 * server-side by role: admins search everything, members get only viewer-visible
 * data (no hidden transactions, proofs, or internal notes).
 */
export const GET = withViewer(async ({ role, req }) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 100);
  if (!q.trim()) return jsonOk({ query: q, groups: [], total: 0 });

  const results = role === "admin" ? await adminSearch(q) : await viewerSearch(q);
  return jsonOk(results);
});
