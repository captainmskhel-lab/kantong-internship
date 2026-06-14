"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TransactionCard } from "@/components/shared/transaction-card";
import { ProofAccordion } from "@/components/shared/proof-accordion";
import { Input, Select } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { Pill } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { rupiah } from "@/lib/money";
import { formatDateID } from "@/lib/dates";
import type { PublicTransaction } from "@/lib/service";

export function ViewerTransactions({
  transactions,
  openCode,
}: {
  transactions: PublicTransaction[];
  openCode?: string;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [selected, setSelected] = useState<PublicTransaction | null>(null);

  // Deep-link from global search.
  useEffect(() => {
    if (!openCode) return;
    const match = transactions.find((t) => t.transaction_code === openCode);
    if (match) setSelected(match);
  }, [openCode, transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (type === "income" && t.transaction_type === "expense") return false;
      if (type === "expense" && t.transaction_type !== "expense") return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${t.title} ${t.transaction_code} ${t.member_name ?? ""} ${t.category_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, type, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari transaksi…" className="pl-10" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value as "all" | "income" | "expense")} className="w-36 shrink-0">
          <option value="all">Semua</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </Select>
      </div>

      <p className="text-xs text-ink-muted">{filtered.length} transaksi</p>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada transaksi di periode ini." />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TransactionCard key={t.id} tx={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      )}

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title} description={selected?.transaction_code}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-canvas p-4">
              <div>
                <div className="text-xs text-ink-muted">Nominal</div>
                <div className="font-heading text-2xl font-extrabold tnum">{rupiah(selected.amount)}</div>
              </div>
              <Pill tone={selected.transaction_type === "expense" ? "neutral" : "positive"}>
                {selected.transaction_type === "expense" ? "Pengeluaran" : selected.transaction_type === "dues" ? "Iuran" : "Pemasukan"}
              </Pill>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Tanggal" value={formatDateID(selected.transaction_date)} />
              <Info label="Cara bayar" value={selected.payment_method === "cash" ? "Cash" : "Transfer"} />
              {selected.member_name && <Info label="Anggota" value={selected.member_name} />}
              {selected.category_name && <Info label="Kategori" value={selected.category_name} />}
            </div>
            {selected.proof_url ? (
              <ProofAccordion proofUrl={selected.proof_url} amount={selected.amount} date={selected.transaction_date} method={selected.payment_method} />
            ) : (
              <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-ink-muted">Bukti belum ditambahkan.</p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-0.5 font-semibold text-ink">{value}</div>
    </div>
  );
}
