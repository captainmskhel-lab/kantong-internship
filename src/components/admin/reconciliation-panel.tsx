"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { rupiah } from "@/lib/money";
import { todayJakartaISO } from "@/lib/dates";

export function ReconciliationPanel({
  systemBankBalance,
  undepositedCash,
}: {
  systemBankBalance: number;
  undepositedCash: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [actual, setActual] = useState<number | null>(null);
  const [date, setDate] = useState(todayJakartaISO());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ matches: boolean; difference: number; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (actual == null) return toast.error("Isi saldo rekening sebenarnya.");
    setBusy(true);
    const res = await apiFetch<{ result: { matches: boolean; difference: number }; message: string }>(
      "/api/reconciliations",
      { method: "POST", body: JSON.stringify({ date, actualBankBalance: actual, note: note.trim() || undefined }) },
    );
    setBusy(false);
    if (!res.ok || !res.data) return toast.error(res.error ?? "Gagal menyimpan rekonsiliasi.");
    setResult({ ...res.data.result, message: res.data.message });
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-heading text-base font-bold">Rekonsiliasi saldo</h3>
          <p className="text-xs text-ink-muted">Cocokkan saldo sistem dengan saldo rekening sebenarnya.</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line p-3">
          <div className="text-xs text-ink-muted">Saldo menurut sistem</div>
          <div className="font-heading text-lg font-bold tnum">{rupiah(systemBankBalance)}</div>
        </div>
        <div className="rounded-2xl border border-line p-3">
          <div className="text-xs text-ink-muted">Cash belum disetor</div>
          <div className="font-heading text-lg font-bold tnum">{rupiah(undepositedCash)}</div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Saldo rekening sebenarnya">
            <MoneyInput value={actual} onChange={setActual} />
          </Field>
          <Field label="Tanggal">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Catatan" hint="Opsional">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
        </Field>
        <Button type="submit" loading={busy}>
          <Scale className="h-4 w-4" /> Cek & simpan rekonsiliasi
        </Button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={
              "mt-4 flex items-center gap-3 rounded-2xl border p-4 " +
              (result.matches ? "border-positive/30 bg-positive/10" : "border-warning/30 bg-warning/10")
            }
          >
            {result.matches ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 14 }}
                className="text-positive"
              >
                <CheckCircle2 className="h-7 w-7" />
              </motion.span>
            ) : (
              <AlertTriangle className="h-7 w-7 text-warning" />
            )}
            <div>
              <p className={"text-sm font-semibold " + (result.matches ? "text-positive" : "text-warning")}>
                {result.message}
              </p>
              {!result.matches && (
                <p className="text-xs text-ink-muted">
                  Selisih: <b className="tnum">{rupiah(result.difference)}</b>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
