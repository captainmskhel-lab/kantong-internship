"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Banknote, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Segmented, Switch, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { rupiah } from "@/lib/money";
import { todayJakartaISO } from "@/lib/dates";
import type { AdminContextData } from "./shell-context";
import type { PaymentMethod } from "@/lib/types";

export function PaymentForm({
  data,
  initialMemberId,
  onDone,
}: {
  data: AdminContextData;
  initialMemberId?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();

  const [memberId, setMemberId] = useState(initialMemberId ?? "");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    `${data.currentMonth.year}-${data.currentMonth.month}`,
  ]);
  const [amount, setAmount] = useState<number | null>(data.settings.monthly_dues_amount);
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [cashDeposited, setCashDeposited] = useState(false);
  const [date, setDate] = useState(todayJakartaISO());
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [visible, setVisible] = useState(true);
  const [proofVisible, setProofVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthsToSubmit = useMemo(
    () =>
      selectedMonths.map((key) => {
        const [year, month] = key.split("-").map(Number);
        return { year, month };
      }),
    [selectedMonths],
  );

  function toggleMonth(key: string) {
    setSelectedMonths((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // Suggest amount = dues * number of months chosen.
      const suggested = data.settings.monthly_dues_amount * Math.max(1, next.length);
      setAmount(suggested);
      return next.length ? next : prev;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!memberId) return setError("Pilih anggota dulu.");
    if (!selectedMonths.length) return setError("Pilih minimal satu bulan iuran.");
    if (!amount || amount <= 0) return setError("Nominal harus lebih dari nol.");

    setLoading(true);
    const res = await apiFetch<{ message: string }>("/api/payments", {
      method: "POST",
      body: JSON.stringify({
        memberId,
        months: monthsToSubmit,
        amount,
        paymentMethod: method,
        cashDeposited: method === "cash" ? cashDeposited : false,
        transactionDate: date,
        proofUrl: proofUrl.trim() || undefined,
        note: note.trim() || undefined,
        visibleToViewers: visible,
        proofVisibleToViewers: proofVisible,
      }),
    });
    setLoading(false);
    if (!res.ok) return setError(res.error ?? "Gagal menyimpan pembayaran.");
    toast.success(res.data?.message ?? "Pembayaran berhasil dicatat.");
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Siapa yang baru bayar?" required>
        <Select value={memberId} onChange={(e) => setMemberId(e.target.value)} autoFocus>
          <option value="">Pilih nama…</option>
          {data.members
            .filter((m) => m.active)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
        </Select>
      </Field>

      <Field label="Untuk kas bulan" hint="Bisa pilih lebih dari satu bulan sekaligus.">
        <div className="flex flex-wrap gap-2">
          {data.monthOptions.map((m) => {
            const key = `${m.year}-${m.month}`;
            const active = selectedMonths.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleMonth(key)}
                className={
                  "tap rounded-xl border px-3 py-1.5 text-sm font-semibold transition " +
                  (active
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-line bg-white text-ink-muted hover:border-brand-200")
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Nominal" required>
        <MoneyInput value={amount} onChange={setAmount} />
        {selectedMonths.length > 1 && (
          <p className="text-xs text-ink-muted">
            {selectedMonths.length} bulan × {rupiah(data.settings.monthly_dues_amount)} ={" "}
            {rupiah(data.settings.monthly_dues_amount * selectedMonths.length)}
          </p>
        )}
      </Field>

      <Field label="Cara bayar">
        <Segmented
          value={method}
          onChange={setMethod}
          options={[
            { value: "transfer", label: "Transfer", icon: <ArrowLeftRight className="h-4 w-4" /> },
            { value: "cash", label: "Cash", icon: <Banknote className="h-4 w-4" /> },
          ]}
        />
      </Field>

      {method === "cash" && (
        <Switch
          checked={cashDeposited}
          onChange={setCashDeposited}
          label={cashDeposited ? "Sudah disetor ke rekening" : "Belum disetor ke rekening"}
          description="Cash dihitung sebagai kas, tapi belum masuk saldo rekening sampai disetor."
        />
      )}

      <Field label="Tanggal bayar">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="Link bukti pembayaran" hint="Tempel link Google Drive. Opsional.">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/file/d/..."
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
        />
      </Field>

      <Field label="Catatan" hint="Opsional.">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan singkat…" />
      </Field>

      <div className="space-y-2 rounded-2xl bg-canvas p-3">
        <Switch checked={visible} onChange={setVisible} label="Tampilkan transaksi ini kepada anggota" />
        <Switch
          checked={proofVisible}
          onChange={setProofVisible}
          label="Izinkan anggota melihat bukti"
          description="Pastikan akses file Google Drive diatur ke “Siapa saja yang memiliki link dapat melihat”."
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {error}
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading}>
        <Save className="h-4 w-4" /> Simpan Pembayaran
      </Button>
    </form>
  );
}
