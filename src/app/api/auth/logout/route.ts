import { jsonOk } from "@/lib/api";
import { clearAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  clearAdminSession();
  return jsonOk({ loggedOut: true });
}
