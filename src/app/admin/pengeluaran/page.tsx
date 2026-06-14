import { getEnrichedTransactions } from "@/lib/service";
import { TransactionsView } from "@/components/admin/transactions-view";
import { RecordExpenseButton } from "@/components/admin/quick-buttons";
import { PageTransition } from "@/components/ui/motion";
import { computeBalances } from "@/lib/finance";
import { getSettings, getTransactions } from "@/lib/repo";
import { rupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [transactions, settings, allTx] = await Promise.all([
    getEnrichedTransactions(true),
    getSettings(),
    getTransactions(),
  ]);
  const balances = computeBalances(settings?.opening_balance ?? 0, allTx);
  const expenses = transactions.filter((t) => t.transaction_type === "expense");

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Pengeluaran</h1>
            <p className="text-sm text-ink-muted">
              Total pengeluaran tercatat: <b className="text-ink tnum">{rupiah(balances.totalExpense)}</b>
            </p>
          </div>
          <RecordExpenseButton size="sm" />
        </div>
        <TransactionsView transactions={expenses} initialType="expense" />
      </div>
    </PageTransition>
  );
}
