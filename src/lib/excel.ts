"use client";

/**
 * excel.ts — multi-sheet workbook export (spec §31). Indonesian column names.
 * Uses SheetJS (xlsx) in the browser.
 */
import * as XLSX from "xlsx";
import { computeBalances, type BalanceInput } from "./finance";
import { formatDateID } from "./dates";
import type { ReportBundle } from "./service";

const statusLabel = (s: string) => (s === "lunas" ? "Lunas" : s === "sebagian" ? "Sebagian" : "Belum bayar");
const methodLabel = (m: string) => (m === "cash" ? "Cash" : "Transfer");
const typeLabel = (t: string) => (t === "expense" ? "Pengeluaran" : t === "dues" ? "Iuran" : "Pemasukan");

export function exportWorkbook(bundle: ReportBundle) {
  const wb = XLSX.utils.book_new();
  const balances = computeBalances(
    bundle.settings.opening_balance,
    bundle.transactions as unknown as BalanceInput[],
  );

  // 1. Ringkasan
  const ringkasan = XLSX.utils.aoa_to_sheet([
    ["Kantong Internship — Ringkasan"],
    ["RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek"],
    [],
    ["Keterangan", "Nilai (Rp)"],
    ["Saldo awal", bundle.settings.opening_balance],
    ["Total pemasukan", balances.totalIncome],
    ["Total pengeluaran", balances.totalExpense],
    ["Saldo kas saat ini", balances.totalCash],
    ["Saldo di rekening", balances.bankBalance],
    ["Cash belum disetor", balances.undepositedCash],
  ]);
  XLSX.utils.book_append_sheet(wb, ringkasan, "Ringkasan");

  // 2. Anggota
  const anggota = XLSX.utils.aoa_to_sheet([
    ["No", "Nama", "Status"],
    ...bundle.members.map((m, i) => [i + 1, m.full_name, m.active ? "Aktif" : "Nonaktif"]),
  ]);
  XLSX.utils.book_append_sheet(wb, anggota, "Anggota");

  // 3. Status Iuran (wide matrix)
  const monthHeaders = bundle.duesMonths.map((m) => m.label);
  const statusRows = bundle.duesRows.map((r) => {
    const cells = r.cells.map((c) => statusLabel(c.status));
    const total = r.cells.reduce((a, c) => a + c.paid, 0);
    return [r.name, ...cells, total];
  });
  const statusIuran = XLSX.utils.aoa_to_sheet([["Nama", ...monthHeaders, "Total (Rp)"], ...statusRows]);
  XLSX.utils.book_append_sheet(wb, statusIuran, "Status Iuran");

  // 4. Pemasukan
  const incomeRows = bundle.transactions
    .filter((t) => t.transaction_type !== "expense")
    .map((t) => [
      t.transaction_code,
      formatDateID(t.transaction_date),
      t.member_name ?? t.recipient_or_source ?? "-",
      t.title,
      methodLabel(t.payment_method),
      t.amount,
    ]);
  const pemasukan = XLSX.utils.aoa_to_sheet([
    ["Kode", "Tanggal", "Anggota/Sumber", "Keterangan", "Cara bayar", "Nominal (Rp)"],
    ...incomeRows,
  ]);
  XLSX.utils.book_append_sheet(wb, pemasukan, "Pemasukan");

  // 5. Pengeluaran
  const expenseRows = bundle.transactions
    .filter((t) => t.transaction_type === "expense")
    .map((t) => [
      t.transaction_code,
      formatDateID(t.transaction_date),
      t.category_name ?? "-",
      t.title,
      methodLabel(t.payment_method),
      t.amount,
    ]);
  const pengeluaran = XLSX.utils.aoa_to_sheet([
    ["Kode", "Tanggal", "Kategori", "Keterangan", "Cara bayar", "Nominal (Rp)"],
    ...expenseRows,
  ]);
  XLSX.utils.book_append_sheet(wb, pengeluaran, "Pengeluaran");

  // 6. Semua Transaksi
  const semua = XLSX.utils.aoa_to_sheet([
    ["Kode", "Tanggal", "Jenis", "Keterangan", "Anggota/Kategori", "Cara bayar", "Nominal (Rp)"],
    ...bundle.transactions.map((t) => [
      t.transaction_code,
      formatDateID(t.transaction_date),
      typeLabel(t.transaction_type),
      t.title,
      t.member_name ?? t.category_name ?? "-",
      methodLabel(t.payment_method),
      t.transaction_type === "expense" ? -t.amount : t.amount,
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, semua, "Semua Transaksi");

  // 7. Rekonsiliasi
  const rekon = XLSX.utils.aoa_to_sheet([
    ["Tanggal", "Saldo Sistem (Rp)", "Saldo Rekening (Rp)", "Cash Belum Disetor (Rp)", "Selisih (Rp)", "Catatan"],
    ...bundle.reconciliations.map((r) => [
      formatDateID(r.reconciliation_date),
      r.expected_bank_balance,
      r.actual_bank_balance,
      r.undeposited_cash,
      r.difference,
      r.note ?? "",
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, rekon, "Rekonsiliasi");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Kantong-Internship-${today}.xlsx`);
}
