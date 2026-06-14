import { buildAdminOverview } from "@/lib/service";
import { DashboardView } from "@/components/admin/dashboard-view";
import { PageTransition } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/states";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const overview = await buildAdminOverview();
  if (!overview) {
    return <EmptyState variant="error" title="Data belum siap" description="Pengaturan belum dikonfigurasi." />;
  }
  return (
    <PageTransition>
      <DashboardView overview={overview} />
    </PageTransition>
  );
}
