import { buildDuesMatrix, buildAdminOverview } from "@/lib/service";
import { DuesMatrix } from "@/components/admin/dues-matrix";
import { RecordPaymentButton } from "@/components/admin/quick-buttons";
import { PageTransition } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/states";
import { rupiah } from "@/lib/money";
import { Users, CalendarClock, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [matrix, overview] = await Promise.all([buildDuesMatrix(), buildAdminOverview()]);
  if (!matrix || !overview) {
    return <EmptyState variant="error" title="Data belum siap" />;
  }

  const activeCount = overview.members.filter((m) => m.active).length;

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Pembayaran iuran</h1>
            <p className="text-sm text-ink-muted">Status iuran semua anggota per bulan.</p>
          </div>
          <RecordPaymentButton size="sm" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Mini icon={<Users className="h-4 w-4" />} label="Anggota aktif" value={`${activeCount} orang`} />
          <Mini icon={<Target className="h-4 w-4" />} label={`Target ${overview.currentMonth.label}`} value={rupiah(overview.periodSummary.targetTotal)} />
          <Mini icon={<CalendarClock className="h-4 w-4" />} label="Jatuh tempo" value={`Tgl ${matrix.settings.due_day}`} />
        </div>

        <DuesMatrix months={matrix.months} rows={matrix.rows} />

        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas px-4 py-3 text-xs text-ink-muted">
          <span className="font-semibold text-ink">Keterangan:</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-positive" /> Lunas</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Sebagian</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-stone-300" /> Belum bayar</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-stone-300" /> Belum mulai</span>
        </div>
      </div>
    </PageTransition>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-3 sm:p-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</div>
      <div className="mt-2 text-[11px] font-medium text-ink-muted sm:text-xs">{label}</div>
      <div className="font-heading text-sm font-bold tnum sm:text-base">{value}</div>
    </div>
  );
}
