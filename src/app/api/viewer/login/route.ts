import { jsonError, jsonOk } from "@/lib/api";
import { pinSchema } from "@/lib/validation";
import { verifyViewerPin } from "@/lib/auth-repo";
import { createViewerSession } from "@/lib/session";
import { checkRateLimit, clientIdentifier, recordAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Permintaan tidak valid.", 400);
  }
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("PIN belum cocok. Coba periksa lagi.", 422);
  }

  const id = clientIdentifier(req);
  const limit = await checkRateLimit(id, "viewer");
  if (limit.blocked) {
    return jsonError("Terlalu banyak percobaan. Coba lagi beberapa saat nanti.", 429);
  }

  const ok = await verifyViewerPin(parsed.data.pin);
  await recordAttempt(id, "viewer", ok);

  if (!ok) {
    return jsonError("PIN belum cocok. Coba periksa lagi.", 401);
  }

  await createViewerSession();
  return jsonOk({ viewer: true });
}
