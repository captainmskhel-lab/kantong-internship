import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { editTransactionSchema } from "@/lib/validation";
import { editTransaction } from "@/lib/repo";

export const runtime = "nodejs";

export const PATCH = (req: Request, ctx: { params: { id: string } }) =>
  withAdmin(async ({ admin, req: r }) => {
    const body = await r.json().catch(() => null);
    const parsed = editTransactionSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 422);
    const { reason, ...patch } = parsed.data;
    // Normalise empty strings to null for nullable fields.
    const clean = Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, v === "" ? null : v]),
    );
    const tx = await editTransaction(ctx.params.id, clean, reason, admin.username);
    if (!tx) return jsonError("Transaksi tidak ditemukan.", 404);
    return jsonOk({ transaction: tx, message: "Transaksi berhasil diperbarui." });
  })(req);
