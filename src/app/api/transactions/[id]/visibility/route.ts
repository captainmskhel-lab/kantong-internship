import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { visibilitySchema } from "@/lib/validation";
import { updateTransactionVisibility } from "@/lib/repo";

export const runtime = "nodejs";

export const PATCH = (req: Request, ctx: { params: { id: string } }) =>
  withAdmin(async ({ admin, req: r }) => {
    const body = await r.json().catch(() => null);
    const parsed = visibilitySchema.safeParse(body);
    if (!parsed.success) return jsonError("Data tidak valid.", 422);
    const tx = await updateTransactionVisibility(ctx.params.id, parsed.data, admin.username);
    if (!tx) return jsonError("Transaksi tidak ditemukan.", 404);
    return jsonOk({ transaction: tx, message: "Pengaturan tampilan diperbarui." });
  })(req);
