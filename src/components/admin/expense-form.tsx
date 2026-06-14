"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Banknote, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Segmented, Switch, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { todayJakartaISO } from "@/lib/dates";
import type { AdminContextData } from "./shell-context";
import type { PaymentMethod } from "@/lib/types";

export function ExpenseForm({ data, onDone }: { data: AdminContextData; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(data.expenseCategories[0]?.id ?? "");
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [date, setDate] = useState(todayJakartaISO());
  const [recipient, setRecipient] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [description, setDescription] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [visible, setVisible] = useState(true);
  const [proofVisible, setProofVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNegative, setConfirmNegative] = useState<string | null>(null);

  async function send(ack: boolean) {
    setLoading(true);
    const res = await apiFetch<{ message: string }>("/api/expenses", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        categoryId: categoryId || null,
        amount,
        date,
        paymentMethod: method,
        recipient: recipient.trim() || undefined,
        proofUrl: proofUrl.trim() || undefined,
        description: description.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
        visibleToViewers: visible,
        proofVisibleToViewers: proofVisible,
        acknowledgeNegative: ack,
      }),
    });
    setLoading(false);
    if (res.status === 409) {
      setConfirmNegative(res.error ?? "Saldo akan menjadi minus. Lanjutkan?");
      return;
    }
    if (!res.ok) {
      setError(res.error ?? "Gagal menyimpan pengeluaran.");
      return;
    }
    toast.success(res.data?.message ?? "Pengeluaran berhasil dicatat.");
    router.refresh();
    onDone();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmNegative(null);
    if (!title.trim()) return setError("Judul pengeluaran belum diisi.");
    if (!amount || amount <= 0) return setError("Nominal harus lebih dari nol.");
    send(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Pengeluaran untuk apa?" required>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Konsumsi rapat" autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kategori">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {data.expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nominal" required>
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>
      </div>

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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Penerima" hint="Opsional">
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Nama / toko" />
        </Field>
      </div>

      <Field label="Link bukti" hint="Link Google Drive. Opsional.">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/file/d/..."
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
        />
      </Field>

      <Field label="Keterangan" hint="Opsional">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <Field label="Catatan internal (hanya bendahara)" hint="Tidak ditampilkan ke anggota.">
        <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className="min-h-[60px]" />
      </Field>

      <div className="space-y-2 rounded-2xl bg-canvas p-3">
        <Switch checked={visible} onChange={setVisible} label="Tampilkan transaksi ini kepada anggota" />
        <Switch checked={proofVisible} onChange={setProofVisible} label="Izinkan anggota melihat bukti" />
      </div>

      {error && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {error}
        </div>
      )}

      {confirmNegative ? (
        <div className="space-y-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm font-medium text-warning">{confirmNegative}</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmNegative(null)} fullWidth>
              Batal
            </Button>
            <Button type="button" variant="danger" onClick={() => send(true)} loading={loading} fullWidth>
              Tetap simpan
            </Button>
          </div>
        </div>
      ) : (
        <Button type="submit" fullWidth size="lg" loading={loading}>
          <Save className="h-4 w-4" /> Simpan Pengeluaran
        </Button>
      )}
    </form>
  );
}
