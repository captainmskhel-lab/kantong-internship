/**
 * search.ts — pure global-search engine (framework-agnostic, unit-tested).
 *
 * Security model lives at the data boundary: the caller passes ADMIN data
 * (with notes) for admin scope, and already-redacted VIEWER data (visible
 * transactions only, no notes/proofs) for viewer scope. This module additionally
 * refuses to search notes when scope === "viewer", as defence in depth.
 */
import { monthLabelID } from "./dates";
import { formatNumberID } from "./money";

export type SearchGroupKey = "anggota" | "pembayaran" | "pengeluaran" | "transaksi" | "laporan";
export type SearchScope = "admin" | "viewer";

export interface SearchMemberInput {
  id: string;
  full_name: string;
  order_number: number;
  active: boolean;
}

export interface SearchTransactionInput {
  id: string;
  transaction_code: string;
  transaction_type: "dues" | "income" | "expense";
  title: string;
  member_name: string | null;
  category_name: string | null;
  amount: number;
  transaction_date: string; // YYYY-MM-DD
  payment_method: "transfer" | "cash";
  description: string | null;
  internal_note: string | null;
  status: "active" | "cancelled";
}

export interface SearchReportInput {
  id: string;
  title: string;
  keywords: string;
  href: string;
}

export interface SearchDataset {
  members: SearchMemberInput[];
  transactions: SearchTransactionInput[];
  reports: SearchReportInput[];
}

export interface SearchHit {
  id: string;
  group: SearchGroupKey;
  title: string;
  subtitle?: string;
  code?: string;
  amount?: number;
  meta: string[];
  href: string;
  score: number;
}

export interface SearchResultGroup {
  key: SearchGroupKey;
  label: string;
  items: SearchHit[];
}

export interface SearchResponse {
  query: string;
  groups: SearchResultGroup[];
  total: number;
}

const GROUP_LABELS: Record<SearchGroupKey, string> = {
  anggota: "Anggota",
  pembayaran: "Pembayaran",
  pengeluaran: "Pengeluaran",
  transaksi: "Transaksi",
  laporan: "Laporan",
};

const PER_GROUP_LIMIT = 8;

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function methodLabel(m: string): string {
  return m === "cash" ? "Cash" : "Transfer";
}
function typeLabel(t: string): string {
  return t === "expense" ? "Pengeluaran" : t === "dues" ? "Iuran" : "Pemasukan";
}

/** Score a haystack against tokens. All tokens must be present (AND match). */
function score(haystack: string, code: string, tokens: string[], rawQuery: string): number | null {
  for (const t of tokens) {
    if (!haystack.includes(t)) return null;
  }
  let s = 10;
  if (code && code === rawQuery) s += 100; // exact transaction code
  if (code && code.startsWith(rawQuery)) s += 40;
  if (haystack.startsWith(rawQuery)) s += 25;
  return s;
}

export function runSearch(query: string, data: SearchDataset, opts: { scope: SearchScope }): SearchResponse {
  const q = norm(query);
  const tokens = q ? q.split(" ").filter(Boolean) : [];
  if (tokens.length === 0) return { query, groups: [], total: 0 };

  const scope = opts.scope;

  // --- Members ---
  const memberHits: SearchHit[] = [];
  for (const m of data.members) {
    const haystack = norm(`${m.full_name} ${m.order_number}`);
    const s = score(haystack, "", tokens, q);
    if (s == null) continue;
    memberHits.push({
      id: m.id,
      group: "anggota",
      title: m.full_name,
      subtitle: m.active ? "Anggota aktif" : "Nonaktif",
      meta: [],
      score: s,
      href: scope === "admin" ? `/admin/anggota?member=${m.id}` : "/lihat/iuran",
    });
  }

  // --- Transactions (dues → pembayaran, expense → pengeluaran, income → transaksi) ---
  const payHits: SearchHit[] = [];
  const expHits: SearchHit[] = [];
  const txHits: SearchHit[] = [];
  for (const t of data.transactions) {
    if (t.status !== "active") continue;
    const [y, mo] = t.transaction_date.split("-").map(Number);
    const periodLabel = Number.isFinite(y) && Number.isFinite(mo) ? monthLabelID(y, mo) : "";
    const haystack = norm(
      [
        t.transaction_code,
        t.title,
        t.member_name ?? "",
        t.category_name ?? "",
        methodLabel(t.payment_method),
        typeLabel(t.transaction_type),
        periodLabel,
        String(t.amount),
        formatNumberID(t.amount),
        // Notes are searchable for the treasurer only — never for viewers.
        scope === "admin" ? t.description ?? "" : "",
        scope === "admin" ? t.internal_note ?? "" : "",
      ].join(" "),
    );
    const s = score(haystack, norm(t.transaction_code), tokens, q);
    if (s == null) continue;

    const hit: SearchHit = {
      id: t.id,
      group: "transaksi",
      title: t.title,
      subtitle: periodLabel || t.category_name || undefined,
      code: t.transaction_code,
      amount: t.amount,
      meta: [methodLabel(t.payment_method)],
      score: s,
      href:
        scope === "admin"
          ? `/admin/transaksi?code=${encodeURIComponent(t.transaction_code)}`
          : `/lihat/transaksi?code=${encodeURIComponent(t.transaction_code)}`,
    };
    if (t.transaction_type === "dues") {
      hit.group = "pembayaran";
      payHits.push(hit);
    } else if (t.transaction_type === "expense") {
      hit.group = "pengeluaran";
      if (t.category_name) hit.meta.push(t.category_name);
      expHits.push(hit);
    } else {
      hit.group = "transaksi";
      txHits.push(hit);
    }
  }

  // --- Reports (admin only) ---
  const reportHits: SearchHit[] = [];
  if (scope === "admin") {
    for (const r of data.reports) {
      const s = score(norm(`${r.title} ${r.keywords} laporan`), "", tokens, q);
      if (s == null) continue;
      reportHits.push({ id: r.id, group: "laporan", title: r.title, meta: ["Laporan"], score: s, href: r.href });
    }
  }

  const baseGroups: SearchResultGroup[] = [
    { key: "anggota", label: GROUP_LABELS.anggota, items: memberHits },
    { key: "pembayaran", label: GROUP_LABELS.pembayaran, items: payHits },
    { key: "pengeluaran", label: GROUP_LABELS.pengeluaran, items: expHits },
    { key: "transaksi", label: GROUP_LABELS.transaksi, items: txHits },
    { key: "laporan", label: GROUP_LABELS.laporan, items: reportHits },
  ];
  const groups: SearchResultGroup[] = baseGroups
    .map((g) => ({ ...g, items: g.items.sort((a, b) => b.score - a.score).slice(0, PER_GROUP_LIMIT) }))
    .filter((g) => g.items.length > 0);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return { query, groups, total };
}

/** Build the admin report search entries from the months that actually have data. */
export function buildReportSearchEntries(transactionDates: string[]): SearchReportInput[] {
  const months = new Set<string>();
  for (const d of transactionDates) {
    if (d) months.add(d.slice(0, 7));
  }
  const entries: SearchReportInput[] = [];
  for (const ym of Array.from(months).sort().reverse()) {
    const [y, m] = ym.split("-").map(Number);
    const label = monthLabelID(y, m);
    entries.push({
      id: `report-monthly-${ym}`,
      title: `Laporan Bulanan ${label}`,
      keywords: `bulanan ${label} pdf`,
      href: "/admin/laporan",
    });
  }
  entries.push({ id: "report-weekly", title: "Laporan Mingguan", keywords: "mingguan pdf rentang", href: "/admin/laporan" });
  entries.push({ id: "report-excel", title: "Export Excel", keywords: "excel xlsx spreadsheet", href: "/admin/laporan" });
  entries.push({ id: "report-backup", title: "Backup data (JSON)", keywords: "backup cadangan json", href: "/admin/laporan" });
  return entries;
}
