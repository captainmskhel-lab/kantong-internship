import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { settingsSchema } from "@/lib/validation";
import { updateSettings } from "@/lib/repo";

export const runtime = "nodejs";

export const PATCH = withAdmin(async ({ req }) => {
  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 422);
  const settings = await updateSettings(parsed.data);
  if (!settings) return jsonError("Pengaturan tidak ditemukan.", 404);
  return jsonOk({ settings, message: "Pengaturan iuran berhasil disimpan." });
});
