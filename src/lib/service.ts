/**
 * service.ts — high-level read models built from repo + finance engine.
 * Used by server components and API routes. The viewer variant is redacted
 * server-side so members never receive hidden data (spec §24, §36).
 */
import "server-only";
import {
  computeBalances,
  memberPeriodStatus,
  summarizePeriodStatuses,
  sumInRange,
  toViewerTransactions,
  type BalanceSummary,
  type MemberPeriodStatus,
} from "./finance";
import {
  getSettings,
  getMembers,
  getTransactions,
  getAllocationsWithStatus,
  getDuesPeriods,
  getCategories,
  getReconciliations,
} from "./repo";
import { currentYearMonthJakarta, monthLabelID, monthLabelShortID, monthRange, monthShortID, monthsBetween, toYearMonth } from "./dates";
import {
  runSearch,
  buildReportSearchEntries,
  type SearchResponse,
  type SearchMemberInput,
  type SearchTransactionInput,
} from "./search";
import type { AppSettings, Category, Member, Reconciliation, Transaction } from "./types";

export interface EnrichedTransaction extends Transaction {
  member_name: string | null;
  category_name: string | null;
}

function enrich(transactions: Transaction[], members: Member[], categories: Category[]): EnrichedTransaction[] {
  const mById = new Map(members.map((m) => [m.id, m.full_name]));
  const cById = new Map(categories.map((c) => [c.id, c.name]));
  return transactions.map((t) => ({
    ...t,
    member_name: t.member_id ? mById.get(t.member_id) ?? null : null,
    category_name: t.category_id ? cById.get(t.category_id) ?? null : null,
  }));
}

export interface CellPayment {
  transaction_code: string;
  transaction_date: string;
  amount: number;
  payment_method: "transfer" | "cash";
  note: string | null;
  proof_url: string | null;
}

export interface DuesMatrixCell extends MemberPeriodStatus {
  notStarted: boolean;
  year: number;
  month: number;
  monthLabel: string;
  payments: CellPayment[];
}

export interface DuesMatrixRow {
  member: Member;
  cells: DuesMatrixCell[];
  totalPaid: number;
}

export interface AdminOverview {
  settings: AppSettings;
  balances: BalanceSummary;
  currentMonth: { year: number; month: number; label: string };
  thisMonthIncome: number;
  thisMonthExpense: number;
  periodSummary: { lunas: number; sebagian: number; belum: number; targetTotal: number; collectedTotal: number };
  unpaidMembers: Member[];
  recentTransactions: EnrichedTransaction[];
  monthlyChart: { label: string; income: number; expense: number }[];
  members: Member[];
}

/** Periods to display in the dues matrix: between internship start month and end (or current+settings span). */
function matrixPeriods(settings: AppSettings, periods: { year: number; month: number }[]) {
  const now = currentYearMonthJakarta();
  // Start: earliest of internship start month / earliest dues period; End: current month.
  // Use the safe parser — the DB value may be a Date object, not a string.
  let start = now;
  const parsedStart = toYearMonth(settings.internship_start_date);
  if (parsedStart) {
    start = parsedStart;
  } else if (periods.length > 0) {
    start = periods.reduce((a, p) => (p.year < a.year || (p.year === a.year && p.month < a.month) ? p : a), periods[0]);
  }
  let end = now;
  const parsedEnd = toYearMonth(settings.internship_end_date);
  if (parsedEnd) {
    end = parsedEnd;
  }
  // Cap matrix end at current month so future months show as "—" only up to a year ahead.
  const months = monthsBetween(start, end);
  return months;
}

export async function buildAdminOverview(): Promise<AdminOverview | null> {
  const settings = await getSettings();
  if (!settings) return null;

  const [members, transactions, allocations, periods, categories] = await Promise.all([
    getMembers(),
    getTransactions({ includeCancelled: false }),
    getAllocationsWithStatus(),
    getDuesPeriods(),
    getCategories(),
  ]);

  const balances = computeBalances(settings.opening_balance, transactions);
  const now = currentYearMonthJakarta();
  const { start, end } = monthRange(now.year, now.month);

  const thisMonthIncome = sumInRange(transactions, "income", start, end);
  const thisMonthExpense = sumInRange(transactions, "expense", start, end);

  // Current period dues status.
  const currentPeriod = periods.find((p) => p.year === now.year && p.month === now.month);
  const activeMembers = members.filter((m) => m.active);
  const obligation = currentPeriod?.amount_per_member ?? settings.monthly_dues_amount;
  const statuses = currentPeriod
    ? activeMembers.map((m) => memberPeriodStatus(allocations, m.id, currentPeriod.id, obligation))
    : activeMembers.map(() => ({ memberId: "", duesPeriodId: "", obligation, paid: 0, remaining: obligation, status: "belum" as const }));
  const counts = summarizePeriodStatuses(statuses);
  const collectedTotal = statuses.reduce((a, s) => a + s.paid, 0);

  const unpaidMembers = currentPeriod
    ? activeMembers.filter((m) => {
        const s = memberPeriodStatus(allocations, m.id, currentPeriod.id, obligation);
        return s.status !== "lunas";
      })
    : activeMembers;

  const enriched = enrich(transactions, members, categories);
  const recentTransactions = enriched.slice(0, 8);

  // Last 6 months chart.
  const monthlyChart: { label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let y = now.year;
    let m = now.month - i;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const r = monthRange(y, m);
    monthlyChart.push({
      label: monthShortID(m),
      income: sumInRange(transactions, "income", r.start, r.end),
      expense: sumInRange(transactions, "expense", r.start, r.end),
    });
  }

  return {
    settings,
    balances,
    currentMonth: { year: now.year, month: now.month, label: monthLabelID(now.year, now.month) },
    thisMonthIncome,
    thisMonthExpense,
    periodSummary: {
      ...counts,
      targetTotal: obligation * activeMembers.length,
      collectedTotal,
    },
    unpaidMembers,
    recentTransactions,
    monthlyChart,
    members,
  };
}

/** Full dues matrix (members × periods) with per-cell payment detail (spec §19). */
export async function buildDuesMatrix(opts?: { redactForViewer?: boolean }) {
  const redact = opts?.redactForViewer === true;
  const settings = await getSettings();
  if (!settings) return null;
  const [members, allocations, periods, transactions] = await Promise.all([
    getMembers(false),
    getAllocationsWithStatus(),
    getDuesPeriods(),
    getTransactions({ includeCancelled: false }),
  ]);
  const months = matrixPeriods(settings, periods);
  const now = currentYearMonthJakarta();
  const txById = new Map(transactions.map((t) => [t.id, t]));

  // Build cell payment details from active allocations.
  const detailByCell = new Map<string, CellPayment[]>();
  for (const a of allocations) {
    if (a.transaction_status !== "active") continue;
    const tx = txById.get(a.transaction_id);
    if (!tx) continue;
    // For viewers, only surface payment rows the treasurer chose to show, and
    // never leak a proof URL unless proof sharing was enabled (spec §24, §36).
    if (redact && !tx.visible_to_viewers) continue;
    const key = `${a.member_id}:${a.dues_period_id}`;
    const list = detailByCell.get(key) ?? [];
    list.push({
      transaction_code: tx.transaction_code,
      transaction_date: tx.transaction_date,
      amount: a.allocated_amount,
      payment_method: tx.payment_method,
      note: redact ? null : tx.description,
      proof_url: redact && !tx.proof_visible_to_viewers ? null : tx.proof_url,
    });
    detailByCell.set(key, list);
  }

  const rows: DuesMatrixRow[] = members.map((member) => {
    let totalPaid = 0;
    const cells: DuesMatrixCell[] = months.map(({ year, month }) => {
      const period = periods.find((p) => p.year === year && p.month === month);
      const obligation = period?.amount_per_member ?? settings.monthly_dues_amount;
      const notStarted = year > now.year || (year === now.year && month > now.month);
      const base = period
        ? memberPeriodStatus(allocations, member.id, period.id, obligation)
        : { memberId: member.id, duesPeriodId: "", obligation, paid: 0, remaining: obligation, status: "belum" as const };
      totalPaid += base.paid;
      const payments = period ? detailByCell.get(`${member.id}:${period.id}`) ?? [] : [];
      return { ...base, notStarted, year, month, monthLabel: monthLabelShortID(year, month), payments };
    });
    return { member, cells, totalPaid };
  });

  return {
    months: months.map((m) => ({ ...m, label: monthLabelShortID(m.year, m.month) })),
    rows,
    settings,
  };
}

// ---------------------------------------------------------------------------
// Viewer-safe read models (spec §24)
// ---------------------------------------------------------------------------
export interface ViewerOverview {
  organizationName: string;
  organizationSubtitle: string;
  balances: { totalCash: number; bankBalance: number; undepositedCash: number; totalIncome: number; totalExpense: number };
  currentMonth: { label: string };
  thisMonthIncome: number;
  thisMonthExpense: number;
  periodSummary: { lunas: number; sebagian: number; belum: number; targetTotal: number; collectedTotal: number };
  recentTransactions: PublicTransaction[];
}

export interface PublicTransaction {
  id: string;
  transaction_code: string;
  transaction_type: Transaction["transaction_type"];
  title: string;
  member_name: string | null;
  category_name: string | null;
  amount: number;
  transaction_date: string;
  payment_method: Transaction["payment_method"];
  proof_url: string | null;
  proof_title: string | null;
  has_proof: boolean;
}

function toPublic(transactions: Transaction[], members: Member[], categories: Category[]): PublicTransaction[] {
  const viewer = toViewerTransactions(transactions);
  const mById = new Map(members.map((m) => [m.id, m.full_name]));
  const cById = new Map(categories.map((c) => [c.id, c.name]));
  return viewer.map((t) => ({
    id: t.id,
    transaction_code: t.transaction_code,
    transaction_type: t.transaction_type,
    title: t.title,
    member_name: t.member_id ? mById.get(t.member_id) ?? null : null,
    category_name: t.category_id ? cById.get(t.category_id) ?? null : null,
    amount: t.amount,
    transaction_date: t.transaction_date,
    payment_method: t.payment_method,
    proof_url: t.proof_url,
    proof_title: t.proof_title,
    has_proof: Boolean(t.proof_url),
  }));
}

export async function buildViewerOverview(): Promise<ViewerOverview | null> {
  const overview = await buildAdminOverview();
  if (!overview) return null;
  const [transactions, members, categories] = await Promise.all([
    getTransactions({ includeCancelled: false }),
    getMembers(),
    getCategories(),
  ]);
  const publicTx = toPublic(transactions, members, categories);
  return {
    organizationName: overview.settings.organization_name,
    organizationSubtitle: overview.settings.organization_subtitle,
    balances: {
      totalCash: overview.balances.totalCash,
      bankBalance: overview.balances.bankBalance,
      undepositedCash: overview.balances.undepositedCash,
      totalIncome: overview.balances.totalIncome,
      totalExpense: overview.balances.totalExpense,
    },
    currentMonth: { label: overview.currentMonth.label },
    thisMonthIncome: overview.thisMonthIncome,
    thisMonthExpense: overview.thisMonthExpense,
    periodSummary: overview.periodSummary,
    recentTransactions: publicTx.slice(0, 12),
  };
}

export async function buildViewerTransactions(): Promise<PublicTransaction[]> {
  const [transactions, members, categories] = await Promise.all([
    getTransactions({ includeCancelled: false }),
    getMembers(),
    getCategories(),
  ]);
  return toPublic(transactions, members, categories);
}

export interface ReportBundle {
  settings: AppSettings;
  transactions: EnrichedTransaction[];
  members: Member[];
  duesMonths: { year: number; month: number; label: string }[];
  duesRows: {
    memberId: string;
    name: string;
    cells: { year: number; month: number; paid: number; obligation: number; status: string }[];
  }[];
  reconciliations: Reconciliation[];
}

/**
 * Everything the report builders need, gathered server-side (spec §30, §31).
 * Reports are an ADMIN-ONLY feature — members cannot generate or download them,
 * so this bundle is never built for viewer mode and needs no redaction.
 */
export async function buildReportBundle(): Promise<ReportBundle | null> {
  const settings = await getSettings();
  if (!settings) return null;
  const [transactions, matrix, reconciliations] = await Promise.all([
    getEnrichedTransactions(false),
    buildDuesMatrix(),
    getReconciliations(),
  ]);
  return {
    settings,
    transactions,
    members: matrix?.rows.map((r) => r.member) ?? [],
    duesMonths: matrix?.months ?? [],
    duesRows:
      matrix?.rows.map((r) => ({
        memberId: r.member.id,
        name: r.member.full_name,
        cells: r.cells.map((c) => ({
          year: c.year,
          month: c.month,
          paid: c.paid,
          obligation: c.obligation,
          status: c.status,
        })),
      })) ?? [],
    reconciliations,
  };
}

export async function getEnrichedTransactions(includeCancelled = false): Promise<EnrichedTransaction[]> {
  const [transactions, members, categories] = await Promise.all([
    getTransactions({ includeCancelled }),
    getMembers(),
    getCategories(),
  ]);
  return enrich(transactions, members, categories);
}

// ---------------------------------------------------------------------------
// Global search (spec: scoped server-side — admin sees all, viewer redacted)
// ---------------------------------------------------------------------------

/** Treasurer search across members, all active transactions, and report shortcuts. */
export async function adminSearch(query: string): Promise<SearchResponse> {
  const [members, transactions] = await Promise.all([getMembers(), getEnrichedTransactions(false)]);
  const memberInput: SearchMemberInput[] = members.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    order_number: m.order_number,
    active: m.active,
  }));
  const txInput: SearchTransactionInput[] = transactions.map((t) => ({
    id: t.id,
    transaction_code: t.transaction_code,
    transaction_type: t.transaction_type,
    title: t.title,
    member_name: t.member_name,
    category_name: t.category_name,
    amount: t.amount,
    transaction_date: t.transaction_date,
    payment_method: t.payment_method,
    description: t.description,
    internal_note: t.internal_note,
    status: t.status,
  }));
  const reports = buildReportSearchEntries(txInput.map((t) => t.transaction_date));
  return runSearch(query, { members: memberInput, transactions: txInput, reports }, { scope: "admin" });
}

/**
 * Member (viewer) search. Built ONLY from viewer-visible data: hidden
 * transactions, proofs and internal notes never reach this path (spec §9, §10).
 */
export async function viewerSearch(query: string): Promise<SearchResponse> {
  const [members, publicTx] = await Promise.all([getMembers(), buildViewerTransactions()]);
  const memberInput: SearchMemberInput[] = members.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    order_number: m.order_number,
    active: m.active,
  }));
  const txInput: SearchTransactionInput[] = publicTx.map((t) => ({
    id: t.id,
    transaction_code: t.transaction_code,
    transaction_type: t.transaction_type,
    title: t.title,
    member_name: t.member_name,
    category_name: t.category_name,
    amount: t.amount,
    transaction_date: t.transaction_date,
    payment_method: t.payment_method,
    description: null, // viewer data carries no notes/descriptions
    internal_note: null,
    status: "active",
  }));
  // Reports are admin-only → never included for viewers.
  return runSearch(query, { members: memberInput, transactions: txInput, reports: [] }, { scope: "viewer" });
}
