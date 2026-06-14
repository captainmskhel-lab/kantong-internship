import { requireViewerPage } from "@/lib/guard";
import { ViewerShell } from "@/components/viewer/viewer-shell";

export const dynamic = "force-dynamic";

export default async function ViewerLayout({ children }: { children: React.ReactNode }) {
  await requireViewerPage();
  return <ViewerShell>{children}</ViewerShell>;
}
