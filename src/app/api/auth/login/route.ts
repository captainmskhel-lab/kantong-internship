import { jsonError, jsonOk } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { getAdminByUsername } from "@/lib/auth-repo";
import { verifySecret } from "@/lib/hash";
import { createAdminSession } from "@/lib/session";
import { checkRateLimit, clientIdentifier, recordAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Permintaan tidak valid.", 400);
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data login tidak valid.", 422);
  }

  const id = clientIdentifier(req);
  const limit = await checkRateLimit(id, "admin");
  if (limit.blocked) {
    return jsonError("Terlalu banyak percobaan. Coba lagi beberapa saat nanti.", 429);
  }

  const admin = await getAdminByUsername(parsed.data.username);
  const ok = admin && admin.active && (await verifySecret(parsed.data.password, admin.password_hash));

  await recordAttempt(id, "admin", Boolean(ok));

  if (!ok || !admin) {
    return jsonError("Username atau password belum cocok.", 401);
  }

  await createAdminSession({ id: admin.id, username: admin.username }, parsed.data.remember);
  return jsonOk({ username: admin.username });
}
