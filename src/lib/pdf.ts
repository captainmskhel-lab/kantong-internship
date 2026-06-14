"use client";

/**
 * pdf.ts — branded monthly & weekly PDF reports (spec §30).
 * Runs in the browser using jsPDF + autotable. White/red identity, print-friendly.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { computePeriodReport, type BalanceInput } from "./finance";
import { rupiah } from "./money";
import { formatDateID, formatTimestampID, monthLabelID, monthRange } from "./dates";
import type { ReportBundle } from "./service";

const RED: [number, number, number] = [220, 38, 38];
const DEEP: [number, number, number] = [153, 27, 27];
const INK: [number, number, number] = [24, 24, 27];
const MUTED: [number, number, number] = [113, 113, 122];
const SOFT: [number, number, number] = [254, 242, 242];

function header(doc: jsPDF, title: string, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  // brand bar
  doc.setFillColor(...RED);
  doc.rect(0, 0, w, 4, "F");
  // logo mark
  doc.setFillColor(...DEEP);
  doc.roundedRect(14, 12, 12, 12, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("K", 20, 20.5, { align: "center" });

  doc.setTextColor(...INK);
  doc.setFontSize(15);
  doc.text("Kantong Internship", 30, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek", 30, 23);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(subtitle, 14, 41.5);
}

function footer(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(228, 228, 231);
    doc.line(14, h - 14, w - 14, h - 14);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Dokumen internal Kantong Internship", 14, h - 9);
    doc.text(`Halaman ${i} / ${pages}`, w - 14, h - 9, { align: "right" });
  }
}

function summaryTable(doc: jsPDF, startY: number, rows: [string, string][]) {
  autoTable(doc, {
    startY,
    theme: "plain",
    body: rows,
    styles: { fontSize: 10, cellPadding: 2.5, textColor: INK },
    columnStyles: {
      0: { textColor: MUTED, cellWidth: 70 },
      1: { fontStyle: "bold", halign: "right" },
    },
  });
}

function lastY(doc: jsPDF, fallback: number): number {
  const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  return y ?? fallback;
}

export function generateMonthlyReport(bundle: ReportBundle, year: number, month: number) {
  const doc = new jsPDF();
  const { start, end } = monthRange(year, month);
  const balInputs = bundle.transactions as unknown as (BalanceInput & { transaction_date: string })[];
  const period = computePeriodReport(balInputs, bundle.settings.opening_balance, start, end);

  const monthTx = bundle.transactions.filter((t) => t.transaction_date >= start && t.transaction_date <= end);
  const incomes = monthTx.filter((t) => t.transaction_type !== "expense");
  const expenses = monthTx.filter((t) => t.transaction_type === "expense");

  // dues status for the month
  const duesStatus = bundle.duesRows.map((r) => {
    const cell = r.cells.find((c) => c.year === year && c.month === month);
    const obligation = cell?.obligation ?? bundle.settings.monthly_dues_amount;
    const paid = cell?.paid ?? 0;
    return { name: r.name, obligation, paid, remaining: Math.max(0, obligation - paid), status: cell?.status ?? "belum" };
  });
  const lunas = duesStatus.filter((d) => d.status === "lunas").length;
  const sebagian = duesStatus.filter((d) => d.status === "sebagian").length;
  const belum = duesStatus.length - lunas - sebagian;

  // --- Page 1: summary ---
  header(doc, `Laporan Bulanan — ${monthLabelID(year, month)}`, `Periode ${formatDateID(start)} s/d ${formatDateID(end)}`);
  summaryTable(doc, 50, [
    ["Saldo awal periode", rupiah(period.openingBalance)],
    ["Total pemasukan", rupiah(period.income)],
    ["Total pengeluaran", rupiah(period.expense)],
    ["Saldo akhir periode", rupiah(period.closingBalance)],
  ]);
  let y = lastY(doc, 80) + 6;

  doc.setFillColor(...SOFT);
  doc.roundedRect(14, y, doc.internal.pageSize.getWidth() - 28, 22, 3, 3, "F");
  doc.setFontSize(10);
  doc.setTextColor(...DEEP);
  doc.setFont("helvetica", "bold");
  doc.text("Status iuran anggota", 20, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  doc.text(`Lunas: ${lunas}   •   Sebagian: ${sebagian}   •   Belum bayar: ${belum}`, 20, y + 15);

  // --- Page 2: income ---
  doc.addPage();
  header(doc, "Pemasukan", monthLabelID(year, month));
  autoTable(doc, {
    startY: 50,
    head: [["Kode", "Tanggal", "Anggota / Sumber", "Keterangan", "Cara", "Nominal"]],
    body: incomes.length
      ? incomes.map((t) => [
          t.transaction_code,
          formatDateID(t.transaction_date),
          t.member_name ?? t.recipient_or_source ?? "-",
          t.title,
          t.payment_method === "cash" ? "Cash" : "Transfer",
          rupiah(t.amount),
        ])
      : [["-", "-", "-", "Belum ada pemasukan", "-", rupiah(0)]],
    foot: [["", "", "", "", "Total", rupiah(period.income)]],
    headStyles: { fillColor: RED, textColor: [255, 255, 255] },
    footStyles: { fillColor: SOFT, textColor: DEEP, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 5: { halign: "right" } },
  });

  // --- Page 3: expenses ---
  doc.addPage();
  header(doc, "Pengeluaran", monthLabelID(year, month));
  autoTable(doc, {
    startY: 50,
    head: [["Kode", "Tanggal", "Kategori", "Keterangan", "Cara", "Nominal"]],
    body: expenses.length
      ? expenses.map((t) => [
          t.transaction_code,
          formatDateID(t.transaction_date),
          t.category_name ?? "-",
          t.title,
          t.payment_method === "cash" ? "Cash" : "Transfer",
          rupiah(t.amount),
        ])
      : [["-", "-", "-", "Belum ada pengeluaran", "-", rupiah(0)]],
    foot: [["", "", "", "", "Total", rupiah(period.expense)]],
    headStyles: { fillColor: RED, textColor: [255, 255, 255] },
    footStyles: { fillColor: SOFT, textColor: DEEP, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 5: { halign: "right" } },
  });

  // --- Page 4: dues status ---
  doc.addPage();
  header(doc, "Status Iuran", monthLabelID(year, month));
  autoTable(doc, {
    startY: 50,
    head: [["Anggota", "Kewajiban", "Dibayar", "Sisa", "Status"]],
    body: duesStatus.map((d) => [
      d.name,
      rupiah(d.obligation),
      rupiah(d.paid),
      rupiah(d.remaining),
      d.status === "lunas" ? "Lunas" : d.status === "sebagian" ? "Sebagian" : "Belum bayar",
    ]),
    headStyles: { fillColor: RED, textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // --- Page 5: notes & proof references ---
  doc.addPage();
  header(doc, "Catatan & Bukti", monthLabelID(year, month));
  const withProof = monthTx.filter((t) => t.proof_url);
  y = 50;
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.text("Referensi bukti (Google Drive):", 14, y);
  doc.setFont("helvetica", "normal");
  y += 7;
  if (withProof.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Tidak ada bukti pada periode ini.", 14, y);
  } else {
    withProof.forEach((t) => {
      doc.setTextColor(...INK);
      doc.text(`${t.transaction_code} — ${t.title} (${rupiah(t.amount)})`, 14, y);
      y += 5;
      doc.setTextColor(...RED);
      doc.textWithLink("Buka bukti di Google Drive", 14, y, { url: t.proof_url as string });
      y += 8;
      if (y > 270) {
        doc.addPage();
        header(doc, "Catatan & Bukti (lanjutan)", monthLabelID(year, month));
        y = 50;
      }
    });
  }
  doc.setTextColor(...MUTED);
  doc.setFontSize(8.5);
  doc.text(`Dibuat pada ${formatTimestampID()}`, 14, 285);

  footer(doc);
  doc.save(`Laporan-Bulanan-${year}-${String(month).padStart(2, "0")}.pdf`);
}

export function generateWeeklyReport(bundle: ReportBundle, startISO: string, endISO: string, note?: string) {
  const doc = new jsPDF();
  const balInputs = bundle.transactions as unknown as (BalanceInput & { transaction_date: string })[];
  const period = computePeriodReport(balInputs, bundle.settings.opening_balance, startISO, endISO);
  const weekTx = bundle.transactions.filter((t) => t.transaction_date >= startISO && t.transaction_date <= endISO);

  header(doc, "Laporan Mingguan", `Periode ${formatDateID(startISO)} s/d ${formatDateID(endISO)}`);
  summaryTable(doc, 50, [
    ["Saldo awal periode", rupiah(period.openingBalance)],
    ["Total pemasukan", rupiah(period.income)],
    ["Total pengeluaran", rupiah(period.expense)],
    ["Saldo akhir periode", rupiah(period.closingBalance)],
  ]);
  const startY = lastY(doc, 90) + 8;

  autoTable(doc, {
    startY,
    head: [["Kode", "Tanggal", "Transaksi", "Jenis", "Cara", "Nominal"]],
    body: weekTx.length
      ? weekTx.map((t) => [
          t.transaction_code,
          formatDateID(t.transaction_date),
          t.title,
          t.transaction_type === "expense" ? "Keluar" : "Masuk",
          t.payment_method === "cash" ? "Cash" : "Transfer",
          `${t.transaction_type === "expense" ? "-" : "+"}${rupiah(t.amount)}`,
        ])
      : [["-", "-", "Tidak ada transaksi", "-", "-", "-"]],
    headStyles: { fillColor: RED, textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 5: { halign: "right" } },
  });

  let yy = lastY(doc, startY + 20) + 8;
  if (note && note.trim()) {
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text("Catatan bendahara:", 14, yy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(note, 180), 14, yy + 6);
    yy += 18;
  }
  doc.setTextColor(...MUTED);
  doc.setFontSize(8.5);
  doc.text(`Dibuat pada ${formatTimestampID()}`, 14, 285);

  footer(doc);
  doc.save(`Laporan-Mingguan-${startISO}.pdf`);
}
