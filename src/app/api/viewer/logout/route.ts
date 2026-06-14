import { jsonOk } from "@/lib/api";
import { clearViewerSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  clearViewerSession();
  return jsonOk({ loggedOut: true });
}
