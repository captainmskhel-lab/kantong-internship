"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { rupiah } from "@/lib/money";
import type { AppSettings } from "@/lib/types";

export function SettingsDues({ settings, activeMembers }: { settings: AppSettings; activeMembers: number }) {
  const router = useRouter();
  const toast = useToast();
  const [orgName, setOrgName] = useState(settings.organization_name);
  const [dues, setDues] = useState<number | null>(settings.monthly_dues_amount);
  const [dueDay, setDueDay] = useState(settings.due_day);
  const [opening, setOpening] = useState<number | null>(settings.opening_balance);
  const [openingDate, setOpeningDate] = useState(settings.opening_balance_date ?? "");
  const [startDate, setStartDate] = useState(settings.internship_start_date ?? "");
  const [endDate, setEndDate] = useState(settings.internship_end_date ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await apiFetch<{ message: string }>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({
        organization_name: orgName.trim(),
        monthly_dues_amount: dues ?? 0,
        due_day: dueDay,
        opening_balance: opening ?? 0,
        opening_balance_date: openingDate || null,
        internship_start_date: startDate || null,
        internship_end_date: endDate || null,
      }),
    });
    setBusy(false);
    if (!res.ok) return toast.error(res.error ?? "Gagal menyimpan pengaturan.");
    toast.success(res.data?.message ?? "Pengaturan iuran berhasil disimpan.");
    router.refresh();
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-heading text-base font-bold">Kas bulanan & saldo awal</h3>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nama aplikasi">
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Iuran per orang / bulan">
            <MoneyInput value={dues} onChange={setDues} />
          </Field>
          <Field label="Jatuh tempo">
            <Select value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Tanggal {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
          Target per bulan: <b className="tnum">{rupiah((dues ?? 0) * activeMembers)}</b> ({activeMembers} anggota aktif)
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Saldo awal" hint="Bukan pemasukan bulan ini.">
            <MoneyInput value={opening} onChange={setOpening} />
          </Field>
          <Field label="Tanggal saldo awal">
            <Input type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mulai internship">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Selesai internship">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <Button type="submit" loading={busy}>
          <Save className="h-4 w-4" /> Simpan pengaturan
        </Button>
      </form>
    </div>
  );
}
