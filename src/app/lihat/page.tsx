import { buildViewerOverview } from "@/lib/service";
import { ViewerSummary } from "@/components/viewer/viewer-summary";
import { PageTransition } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/states";

export const dynamic = "force-dynamic";

export default async function ViewerHomePage() {
  const overview = await buildViewerOverview();
  if (!overview) return <EmptyState variant="error" title="Data belum siap" />;
  return (
    <PageTransition>
      <ViewerSummary overview={overview} />
    </PageTransition>
  );
}
