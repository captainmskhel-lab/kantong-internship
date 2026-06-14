import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { cancelSchema } from "@/lib/validation";
import { cancelTransaction } from "@/lib/repo";

export const runtime = "nodejs";

export const POST = (req: Request, ctx: { params: { id: string } }) =>
  withAdmin(async ({ admin, req: r }) => {
    const body = await r.json().catch(() => null);
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Alasan tidak valid.", 422);
    const tx = await cancelTransaction(ctx.params.id, parsed.data.reason, admin.username);
    if (!tx) return jsonError("Transaksi tidak ditemukan.", 404);
    return jsonOk({ transaction: tx, message: "Transaksi berhasil dibatalkan." });
  })(req);
