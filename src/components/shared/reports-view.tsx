"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, CalendarDays, CalendarRange, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { generateMonthlyReport, generateWeeklyReport } from "@/lib/pdf";
import { exportWorkbook } from "@/lib/excel";
import { monthLabelID, todayJakartaISO } from "@/lib/dates";
import type { ReportBundle } from "@/lib/service";

export function ReportsView({ bundle, allowBackup = false }: { bundle: ReportBundle; allowBackup?: boolean }) {
  const toast = useToast();
  const [month, setMonth] = useState(
    bundle.duesMonths.length ? `${bundle.duesMonths[bundle.duesMonths.length - 1].year}-${bundle.duesMonths[bundle.duesMonths.length - 1].month}` : "",
  );
  const today = todayJakartaISO();
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [weekStart, setWeekStart] = useState(weekAgo);
  const [weekEnd, setWeekEnd] = useState(today);
  const [note, setNote] = useState("");

  function monthly() {
    if (!month) return;
    const [y, m] = month.split("-").map(Number);
    try {
      generateMonthlyReport(bundle, y, m);
      toast.success("Laporan bulanan berhasil dibuat.");
    } catch {
      toast.error("Gagal membuat PDF. Coba lagi.");
    }
  }

  function weekly() {
    try {
      generateWeeklyReport(bundle, weekStart, weekEnd, note);
      toast.success("Laporan mingguan berhasil dibuat.");
    } catch {
      toast.error("Gagal membuat PDF. Coba lagi.");
    }
  }

  function excel() {
    try {
      exportWorkbook(bundle);
      toast.success("File Excel berhasil dibuat.");
    } catch {
      toast.error("Gagal membuat Excel. Coba lagi.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Monthly */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-heading text-base font-bold">Laporan bulanan (PDF)</h3>
            <p className="text-xs text-ink-muted">Ringkasan, pemasukan, pengeluaran, status iuran, bukti.</p>
          </div>
        </div>
        <Field label="Pilih bulan">
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {bundle.duesMonths
              .slice()
              .reverse()
              .map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {monthLabelID(m.year, m.month)}
                </option>
              ))}
          </Select>
        </Field>
        <Button className="mt-3" onClick={monthly} disabled={!month}>
          <FileText className="h-4 w-4" /> Unduh laporan bulanan
        </Button>
      </div>

      {/* Weekly */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <CalendarRange className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-heading text-base font-bold">Laporan mingguan (PDF)</h3>
            <p className="text-xs text-ink-muted">Rangkuman transaksi pada rentang tanggal.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari">
            <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <Input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} />
          </Field>
        </div>
        {allowBackup && (
          <Field label="Catatan bendahara (opsional)" className="mt-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[50px]" />
          </Field>
        )}
        <Button className="mt-3" onClick={weekly}>
          <FileText className="h-4 w-4" /> Unduh laporan mingguan
        </Button>
      </div>

      {/* Excel */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-positive/10 text-positive">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-heading text-base font-bold">Export Excel</h3>
            <p className="text-xs text-ink-muted">7 sheet: ringkasan, anggota, iuran, pemasukan, pengeluaran, transaksi, rekonsiliasi.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={excel}>
          <FileSpreadsheet className="h-4 w-4" /> Unduh Excel (.xlsx)
        </Button>
      </div>

      {/* Backup (admin only) */}
      {allowBackup && (
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-ink-muted">
              <Download className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading text-base font-bold">Backup data (JSON)</h3>
              <p className="text-xs text-ink-muted">Seluruh data tanpa password/PIN. Untuk arsip & pemulihan.</p>
            </div>
          </div>
          <a href="/api/backup" download>
            <Button variant="secondary">
              <Download className="h-4 w-4" /> Unduh backup JSON
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
