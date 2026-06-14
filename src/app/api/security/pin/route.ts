import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { changePinSchema } from "@/lib/validation";
import { changePin } from "@/lib/auth-repo";

export const runtime = "nodejs";

export const POST = withAdmin(async ({ admin, req }) => {
  const body = await req.json().catch(() => null);
  const parsed = changePinSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 422);
  const result = await changePin(admin.sub, parsed.data.currentPassword, parsed.data.newPin);
  if (!result.ok) return jsonError(result.error ?? "Gagal mengganti PIN.", 400);
  return jsonOk({ message: "PIN anggota berhasil diganti." });
});
