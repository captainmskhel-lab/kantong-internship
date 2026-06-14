import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { changeUsernameSchema } from "@/lib/validation";
import { changeUsername } from "@/lib/auth-repo";
import { createAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export const POST = withAdmin(async ({ admin, req }) => {
  const body = await req.json().catch(() => null);
  const parsed = changeUsernameSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 422);
  const result = await changeUsername(admin.sub, parsed.data.currentPassword, parsed.data.newUsername);
  if (!result.ok) return jsonError(result.error ?? "Gagal mengganti username.", 400);
  // Refresh the session so it carries the new username.
  await createAdminSession({ id: admin.sub, username: parsed.data.newUsername }, true);
  return jsonOk({ message: "Username bendahara berhasil diganti." });
});
