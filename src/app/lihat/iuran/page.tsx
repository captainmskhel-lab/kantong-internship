import { buildDuesMatrix } from "@/lib/service";
import { DuesMatrix } from "@/components/admin/dues-matrix";
import { PageTransition } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/states";

export const dynamic = "force-dynamic";

export default async function ViewerDuesPage() {
  const matrix = await buildDuesMatrix({ redactForViewer: true });
  if (!matrix) return <EmptyState variant="error" title="Data belum siap" />;
  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Status iuran</h1>
          <p className="text-sm text-ink-muted">Status pembayaran iuran semua anggota.</p>
        </div>
        <DuesMatrix months={matrix.months} rows={matrix.rows} />
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas px-4 py-3 text-xs text-ink-muted">
          <span className="font-semibold text-ink">Keterangan:</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-positive" /> Lunas</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Sebagian</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-stone-300" /> Belum bayar</span>
        </div>
      </div>
    </PageTransition>
  );
}
