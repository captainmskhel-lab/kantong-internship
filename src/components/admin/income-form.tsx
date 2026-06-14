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

export function IncomeForm({ data, onDone }: { data: AdminContextData; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(data.incomeCategories[0]?.id ?? "");
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [cashDeposited, setCashDeposited] = useState(false);
  const [date, setDate] = useState(todayJakartaISO());
  const [source, setSource] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [visible, setVisible] = useState(true);
  const [proofVisible, setProofVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Judul pemasukan belum diisi.");
    if (!amount || amount <= 0) return setError("Nominal harus lebih dari nol.");
    setLoading(true);
    const res = await apiFetch<{ message: string }>("/api/income", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        categoryId: categoryId || null,
        amount,
        date,
        paymentMethod: method,
        cashDeposited: method === "cash" ? cashDeposited : false,
        source: source.trim() || undefined,
        proofUrl: proofUrl.trim() || undefined,
        note: note.trim() || undefined,
        visibleToViewers: visible,
        proofVisibleToViewers: proofVisible,
      }),
    });
    setLoading(false);
    if (!res.ok) return setError(res.error ?? "Gagal menyimpan pemasukan.");
    toast.success(res.data?.message ?? "Pemasukan berhasil dicatat.");
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Pemasukan untuk apa?" required>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Donasi alumni" autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kategori">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {data.incomeCategories.map((c) => (
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

      {method === "cash" && (
        <Switch
          checked={cashDeposited}
          onChange={setCashDeposited}
          label={cashDeposited ? "Sudah disetor ke rekening" : "Belum disetor ke rekening"}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Sumber" hint="Opsional">
          <Input value={source} onChange={(e) => setSource(e.target.value)} />
        </Field>
      </div>

      <Field label="Link bukti" hint="Opsional">
        <Input type="url" inputMode="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://drive.google.com/..." />
      </Field>

      <Field label="Catatan" hint="Opsional">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
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

      <Button type="submit" fullWidth size="lg" loading={loading}>
        <Save className="h-4 w-4" /> Simpan Pemasukan
      </Button>
    </form>
  );
}
