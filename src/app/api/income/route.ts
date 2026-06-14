import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { incomeSchema } from "@/lib/validation";
import { createIncome } from "@/lib/repo";

export const runtime = "nodejs";

export const POST = withAdmin(async ({ admin, req }) => {
  const body = await req.json().catch(() => null);
  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data pemasukan tidak valid.", 422);
  }
  const d = parsed.data;
  const tx = await createIncome({
    title: d.title,
    categoryId: d.categoryId ?? null,
    amount: d.amount,
    date: d.date,
    paymentMethod: d.paymentMethod,
    cashDeposited: d.cashDeposited,
    source: d.source ? d.source : null,
    proofUrl: d.proofUrl ? d.proofUrl : null,
    proofTitle: d.proofTitle ? d.proofTitle : null,
    note: d.note ? d.note : null,
    internalNote: d.internalNote ? d.internalNote : null,
    visibleToViewers: d.visibleToViewers,
    proofVisibleToViewers: d.proofVisibleToViewers,
    createdBy: admin.username,
  });
  return jsonOk({ transaction: tx, message: `Pemasukan "${d.title}" berhasil dicatat.` });
});
