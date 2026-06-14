"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Filter, Banknote, Ban, Save } from "lucide-react";
import { TransactionCard } from "@/components/shared/transaction-card";
import { ProofAccordion } from "@/components/shared/proof-accordion";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Pill } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { rupiah } from "@/lib/money";
import { formatDateID } from "@/lib/dates";
import type { EnrichedTransaction } from "@/lib/service";

type TypeFilter = "all" | "income" | "expense";
type MethodFilter = "all" | "transfer" | "cash";

export function TransactionsView({
  transactions,
  initialType = "all",
  openCode,
}: {
  transactions: EnrichedTransaction[];
  initialType?: TypeFilter;
  openCode?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>(initialType);
  const [method, setMethod] = useState<MethodFilter>("all");
  const [proof, setProof] = useState<"all" | "has" | "none">("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [month, setMonth] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<EnrichedTransaction | null>(null);

  // Deep-link from global search: open the matching transaction's detail.
  useEffect(() => {
    if (!openCode) return;
    const match = transactions.find((t) => t.transaction_code === openCode);
    if (match) {
      setShowCancelled(true);
      setSelected(match);
    }
  }, [openCode, transactions]);

  const months = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.transaction_date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (!showCancelled && t.status === "cancelled") return false;
      if (type !== "all") {
        if (type === "income" && t.transaction_type === "expense") return false;
        if (type === "expense" && t.transaction_type !== "expense") return false;
      }
      if (method !== "all" && t.payment_method !== method) return false;
      if (proof === "has" && !t.proof_url) return false;
      if (proof === "none" && t.proof_url) return false;
      if (month !== "all" && !t.transaction_date.startsWith(month)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${t.title} ${t.transaction_code} ${t.member_name ?? ""} ${t.category_name ?? ""} ${t.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, showCancelled, type, method, proof, month, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, judul, kode, catatan…"
            className="pl-10"
          />
        </div>
        <Button variant="secondary" size="md" onClick={() => setShowFilters((s) => !s)} className="shrink-0">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-4">
              <Field label="Jenis">
                <Select value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
                  <option value="all">Semua</option>
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </Select>
              </Field>
              <Field label="Cara bayar">
                <Select value={method} onChange={(e) => setMethod(e.target.value as MethodFilter)}>
                  <option value="all">Semua</option>
                  <option value="transfer">Transfer</option>
                  <option value="cash">Cash</option>
                </Select>
              </Field>
              <Field label="Bukti">
                <Select value={proof} onChange={(e) => setProof(e.target.value as "all" | "has" | "none")}>
                  <option value="all">Semua</option>
                  <option value="has">Ada bukti</option>
                  <option value="none">Tanpa bukti</option>
                </Select>
              </Field>
              <Field label="Bulan">
                <Select value={month} onChange={(e) => setMonth(e.target.value)}>
                  <option value="all">Semua</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="col-span-2 sm:col-span-4">
                <Switch checked={showCancelled} onChange={setShowCancelled} label="Tampilkan transaksi dibatalkan" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-ink-muted">{filtered.length} transaksi</p>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada transaksi di periode ini." description="Coba ubah filter atau catat transaksi baru." />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TransactionCard key={t.id} tx={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      )}

      <TransactionDetail
        tx={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          router.refresh();
          setSelected(null);
        }}
        toast={toast}
      />
    </div>
  );
}

function TransactionDetail({
  tx,
  onClose,
  onChanged,
  toast,
}: {
  tx: EnrichedTransaction | null;
  onClose: () => void;
  onChanged: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [askCancel, setAskCancel] = useState(false);

  // edit fields
  const [amount, setAmount] = useState<number | null>(tx?.amount ?? null);
  const [date, setDate] = useState(tx?.transaction_date ?? "");
  const [note, setNote] = useState(tx?.description ?? "");
  const [editReason, setEditReason] = useState("");

  // Re-sync editable fields whenever a different transaction is opened.
  useEffect(() => {
    setAmount(tx?.amount ?? null);
    setDate(tx?.transaction_date ?? "");
    setNote(tx?.description ?? "");
    setEditReason("");
    setEditing(false);
    setAskCancel(false);
    setCancelReason("");
  }, [tx?.id, tx?.amount, tx?.transaction_date, tx?.description]);

  if (!tx) return null;

  async function call(url: string, options: RequestInit, successMsg?: string) {
    setBusy(true);
    const res = await apiFetch<{ message?: string }>(url, options);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Gagal memproses.");
      return false;
    }
    toast.success(res.data?.message ?? successMsg ?? "Berhasil.");
    onChanged();
    return true;
  }

  const cancelled = tx.status === "cancelled";

  return (
    <Sheet open={Boolean(tx)} onClose={onClose} title={tx.title} description={tx.transaction_code}>
      <div className="space-y-4" key={tx.id}>
        <div className="flex items-center justify-between rounded-2xl bg-canvas p-4">
          <div>
            <div className="text-xs text-ink-muted">Nominal</div>
            <div className="font-heading text-2xl font-extrabold tnum">{rupiah(tx.amount)}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Pill tone={tx.transaction_type === "expense" ? "neutral" : "positive"}>
              {tx.transaction_type === "expense" ? "Pengeluaran" : tx.transaction_type === "dues" ? "Iuran" : "Pemasukan"}
            </Pill>
            {cancelled && <Pill tone="warning">Dibatalkan</Pill>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Tanggal" value={formatDateID(tx.transaction_date)} />
          <Info label="Cara bayar" value={tx.payment_method === "cash" ? "Cash" : "Transfer"} />
          {tx.member_name && <Info label="Anggota" value={tx.member_name} />}
          {tx.category_name && <Info label="Kategori" value={tx.category_name} />}
          {tx.recipient_or_source && <Info label="Penerima/Sumber" value={tx.recipient_or_source} />}
        </div>

        {tx.description && <p className="rounded-2xl bg-canvas p-3 text-sm text-ink-muted">{tx.description}</p>}
        {tx.internal_note && (
          <p className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            Catatan bendahara: {tx.internal_note}
          </p>
        )}

        {tx.proof_url && <ProofAccordion proofUrl={tx.proof_url} amount={tx.amount} date={tx.transaction_date} method={tx.payment_method} />}

        {cancelled && tx.cancellation_reason && (
          <p className="text-sm text-ink-muted">Alasan dibatalkan: {tx.cancellation_reason}</p>
        )}

        {!cancelled && (
          <>
            {/* visibility */}
            <div className="space-y-2 rounded-2xl bg-canvas p-3">
              <Switch
                checked={tx.visible_to_viewers}
                onChange={(v) => call(`/api/transactions/${tx.id}/visibility`, { method: "PATCH", body: JSON.stringify({ visible_to_viewers: v }) }, "Pengaturan tampilan diperbarui.")}
                label="Tampilkan ke anggota"
              />
              <Switch
                checked={tx.proof_visible_to_viewers}
                onChange={(v) => call(`/api/transactions/${tx.id}/visibility`, { method: "PATCH", body: JSON.stringify({ proof_visible_to_viewers: v }) }, "Pengaturan bukti diperbarui.")}
                label="Izinkan anggota melihat bukti"
              />
            </div>

            {/* cash deposit */}
            {tx.payment_method === "cash" && tx.cash_deposit_status === "undeposited" && (
              <Button
                fullWidth
                variant="secondary"
                loading={busy}
                onClick={() => call(`/api/transactions/${tx.id}/deposit`, { method: "POST" }, "Cash ditandai sudah disetor.")}
              >
                <Banknote className="h-4 w-4" /> Tandai sudah disetor
              </Button>
            )}

            {/* edit */}
            {!editing ? (
              <Button fullWidth variant="ghost" onClick={() => setEditing(true)}>
                Ubah transaksi
              </Button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-line p-3">
                <Field label="Nominal">
                  <MoneyInput value={amount} onChange={setAmount} />
                </Field>
                <Field label="Tanggal">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Keterangan">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
                </Field>
                <Field label="Alasan perubahan" required>
                  <Input value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Misal: salah nominal" />
                </Field>
                <Button
                  fullWidth
                  loading={busy}
                  disabled={editReason.trim().length < 3}
                  onClick={() =>
                    call(
                      `/api/transactions/${tx.id}`,
                      {
                        method: "PATCH",
                        body: JSON.stringify({
                          amount: amount ?? undefined,
                          transaction_date: date || undefined,
                          description: note,
                          reason: editReason,
                        }),
                      },
                      "Transaksi diperbarui.",
                    )
                  }
                >
                  <Save className="h-4 w-4" /> Simpan perubahan
                </Button>
              </div>
            )}

            {/* cancel */}
            {!askCancel ? (
              <Button fullWidth variant="danger" onClick={() => setAskCancel(true)}>
                <Ban className="h-4 w-4" /> Batalkan transaksi
              </Button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-3">
                <Field label="Alasan pembatalan" required>
                  <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Tulis alasan singkat" />
                </Field>
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setAskCancel(false)}>
                    Batal
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    loading={busy}
                    disabled={cancelReason.trim().length < 3}
                    onClick={() => call(`/api/transactions/${tx.id}/cancel`, { method: "POST", body: JSON.stringify({ reason: cancelReason }) }, "Transaksi dibatalkan.")}
                  >
                    Ya, batalkan
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
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
