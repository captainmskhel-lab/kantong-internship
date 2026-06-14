import { buildReportBundle } from "@/lib/service";
import { ReportsView } from "@/components/shared/reports-view";
import { PageTransition } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/states";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const bundle = await buildReportBundle();
  if (!bundle) return <EmptyState variant="error" title="Data belum siap" />;
  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Laporan</h1>
          <p className="text-sm text-ink-muted">Buat laporan PDF, export Excel, dan backup data.</p>
        </div>
        <ReportsView bundle={bundle} allowBackup />
      </div>
    </PageTransition>
  );
}
