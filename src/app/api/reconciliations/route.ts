import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { reconciliationSchema } from "@/lib/validation";
import { createReconciliation, getSettings, getTransactions } from "@/lib/repo";
import { computeBalances, reconcile } from "@/lib/finance";

export const runtime = "nodejs";

export const POST = withAdmin(async ({ admin, req }) => {
  const body = await req.json().catch(() => null);
  const parsed = reconciliationSchema.safeParse(body);
  if (!parsed.success) return jsonError("Data rekonsiliasi tidak valid.", 422);

  const [settings, transactions] = await Promise.all([getSettings(), getTransactions()]);
  const balances = computeBalances(settings?.opening_balance ?? 0, transactions);
  const result = reconcile(balances.bankBalance, parsed.data.actualBankBalance, balances.undepositedCash);

  const saved = await createReconciliation({
    date: parsed.data.date,
    expected: balances.bankBalance,
    actual: parsed.data.actualBankBalance,
    undeposited: balances.undepositedCash,
    note: parsed.data.note ? parsed.data.note : null,
    by: admin.username,
  });

  return jsonOk({
    reconciliation: saved,
    result,
    message: result.matches
      ? "Saldo sudah sesuai."
      : "Saldo belum sesuai. Coba periksa transaksi cash atau transaksi yang belum dicatat.",
  });
});
