import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { paymentSchema } from "@/lib/validation";
import { createDuesPayment, getMemberById, getSettings } from "@/lib/repo";
import { monthLabelID } from "@/lib/dates";

export const runtime = "nodejs";

export const POST = withAdmin(async ({ admin, req }) => {
  const body = await req.json().catch(() => null);
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data pembayaran tidak valid.", 422);
  }
  const data = parsed.data;

  const [member, settings] = await Promise.all([getMemberById(data.memberId), getSettings()]);
  if (!member) return jsonError("Anggota tidak ditemukan.", 404);
  if (!settings) return jsonError("Pengaturan belum dikonfigurasi.", 400);

  const tx = await createDuesPayment({
    memberId: data.memberId,
    duesPeriods: data.months,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    cashDeposited: data.cashDeposited,
    transactionDate: data.transactionDate,
    proofUrl: data.proofUrl ? data.proofUrl : null,
    proofTitle: data.proofTitle ? data.proofTitle : null,
    note: data.note ? data.note : null,
    visibleToViewers: data.visibleToViewers,
    proofVisibleToViewers: data.proofVisibleToViewers,
    monthlyDuesAmount: settings.monthly_dues_amount,
    dueDay: settings.due_day,
    createdBy: admin.username,
    memberName: member.full_name,
  });

  const first = data.months[0];
  const periodLabel =
    data.months.length === 1
      ? monthLabelID(first.year, first.month)
      : `${data.months.length} bulan`;

  return jsonOk({
    transaction: tx,
    message: `Pembayaran ${member.full_name} untuk ${periodLabel} berhasil dicatat.`,
  });
});
