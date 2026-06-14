import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { expenseSchema } from "@/lib/validation";
import { createExpense, getSettings, getTransactions } from "@/lib/repo";
import { computeBalances } from "@/lib/finance";
import { rupiah } from "@/lib/money";

export const runtime = "nodejs";

export const POST = withAdmin(async ({ admin, req }) => {
  const body = await req.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data pengeluaran tidak valid.", 422);
  }
  const d = parsed.data;

  // Warn before creating a negative balance (spec §22). The UI re-submits with
  // acknowledgeNegative = true to confirm.
  if (!d.acknowledgeNegative) {
    const [settings, transactions] = await Promise.all([getSettings(), getTransactions()]);
    const balances = computeBalances(settings?.opening_balance ?? 0, transactions);
    if (balances.totalCash - d.amount < 0) {
      return jsonError(
        `Saldo kas akan menjadi minus. Saldo saat ini ${rupiah(balances.totalCash)}, pengeluaran ${rupiah(d.amount)}. Lanjutkan?`,
        409,
      );
    }
  }

  const tx = await createExpense({
    title: d.title,
    categoryId: d.categoryId ?? null,
    amount: d.amount,
    date: d.date,
    paymentMethod: d.paymentMethod,
    recipient: d.recipient ? d.recipient : null,
    proofUrl: d.proofUrl ? d.proofUrl : null,
    proofTitle: d.proofTitle ? d.proofTitle : null,
    description: d.description ? d.description : null,
    internalNote: d.internalNote ? d.internalNote : null,
    visibleToViewers: d.visibleToViewers,
    proofVisibleToViewers: d.proofVisibleToViewers,
    createdBy: admin.username,
  });
  return jsonOk({ transaction: tx, message: `Pengeluaran "${d.title}" berhasil dicatat.` });
});
