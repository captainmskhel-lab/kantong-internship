import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { markCashDeposited } from "@/lib/repo";

export const runtime = "nodejs";

export const POST = (req: Request, ctx: { params: { id: string } }) =>
  withAdmin(async ({ admin }) => {
    const tx = await markCashDeposited(ctx.params.id, admin.username);
    if (!tx) return jsonError("Transaksi tidak ditemukan.", 404);
    return jsonOk({ transaction: tx, message: "Cash ditandai sudah disetor ke rekening." });
  })(req);
