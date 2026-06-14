import { buildViewerTransactions } from "@/lib/service";
import { ViewerTransactions } from "@/components/viewer/viewer-transactions";
import { PageTransition } from "@/components/ui/motion";

export const dynamic = "force-dynamic";

export default async function ViewerTransactionsPage({ searchParams }: { searchParams: { code?: string } }) {
  const transactions = await buildViewerTransactions();
  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Transaksi</h1>
          <p className="text-sm text-ink-muted">Riwayat pemasukan dan pengeluaran kas.</p>
        </div>
        <ViewerTransactions transactions={transactions} openCode={searchParams.code} />
      </div>
    </PageTransition>
  );
}
