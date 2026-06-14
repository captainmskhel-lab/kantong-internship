import { jsonError, jsonOk } from "@/lib/api";
import { setupSchema } from "@/lib/validation";
import { completeSetup } from "@/lib/auth-repo";
import { isSetupCompleted } from "@/lib/repo";
import { passwordIssue } from "@/lib/hash";
import { createAdminSession } from "@/lib/session";
import { getAdminByUsername } from "@/lib/auth-repo";

export const runtime = "nodejs";

export async function GET() {
  try {
    const done = await isSetupCompleted();
    return jsonOk({ setupCompleted: done });
  } catch (err) {
    console.error("[setup] status check failed:", err);
    // Friendly message for the UI; detailed error only in server logs.
    return jsonError("Tidak bisa terhubung ke database. Coba lagi sebentar.", 503);
  }
}

export async function POST(req: Request) {
  // Block re-running setup once completed (spec §33).
  let alreadyDone: boolean;
  try {
    alreadyDone = await isSetupCompleted();
  } catch (err) {
    console.error("[setup] pre-check DB error:", err);
    return jsonError("Tidak bisa terhubung ke database. Periksa koneksi lalu coba lagi.", 503);
  }
  if (alreadyDone) {
    return jsonError("Setup sudah selesai. Halaman ini tidak bisa diakses lagi.", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Permintaan tidak valid.", 400);
  }
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data setup tidak valid.", 422);
  }
  const pwIssue = passwordIssue(parsed.data.password);
  if (pwIssue) return jsonError(pwIssue, 422);

  try {
    const result = await completeSetup({
      organizationName: parsed.data.organizationName,
      monthlyDuesAmount: parsed.data.monthlyDuesAmount,
      dueDay: parsed.data.dueDay,
      startMonth: parsed.data.startMonth,
      openingBalance: parsed.data.openingBalance,
      openingBalanceDate: parsed.data.openingBalanceDate ?? null,
      internshipStartDate: parsed.data.internshipStartDate ?? null,
      internshipEndDate: parsed.data.internshipEndDate ?? null,
      username: parsed.data.username,
      password: parsed.data.password,
      pin: parsed.data.pin,
    });
    if (!result.ok) return jsonError(result.error ?? "Setup gagal disimpan.", 400);

    // Log the treasurer in immediately after setup.
    const admin = await getAdminByUsername(parsed.data.username);
    if (admin) await createAdminSession({ id: admin.id, username: admin.username }, true);

    return jsonOk({ setupCompleted: true });
  } catch (err) {
    // The whole completeSetup runs in one transaction; on any error nothing is
    // committed, so no partial/broken records are left behind.
    console.error("[setup] completeSetup failed:", err);
    return jsonError(
      "Setup gagal disimpan ke database. Tidak ada data sebagian yang tersimpan. Coba lagi.",
      500,
    );
  }
}
