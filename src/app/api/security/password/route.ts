import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validation";
import { changePassword } from "@/lib/auth-repo";
import { passwordIssue } from "@/lib/hash";

export const runtime = "nodejs";

export const POST = withAdmin(async ({ admin, req }) => {
  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 422);
  const issue = passwordIssue(parsed.data.newPassword);
  if (issue) return jsonError(issue, 422);
  const result = await changePassword(admin.sub, parsed.data.currentPassword, parsed.data.newPassword);
  if (!result.ok) return jsonError(result.error ?? "Gagal memperbarui password.", 400);
  return jsonOk({ message: "Password berhasil diperbarui." });
});
