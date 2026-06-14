import { getEnrichedTransactions } from "@/lib/service";
import { TransactionsView } from "@/components/admin/transactions-view";
import { RecordPaymentButton, RecordExpenseButton, RecordIncomeButton } from "@/components/admin/quick-buttons";
import { PageTransition } from "@/components/ui/motion";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const transactions = await getEnrichedTransactions(true);
  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Transaksi</h1>
            <p className="text-sm text-ink-muted">Semua pemasukan, iuran, dan pengeluaran.</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <RecordPaymentButton size="sm" />
            <RecordExpenseButton size="sm" />
            <RecordIncomeButton size="sm" />
          </div>
        </div>
        <TransactionsView transactions={transactions} openCode={searchParams.code} />
      </div>
    </PageTransition>
  );
}
