/**
 * finance.ts — the single source of truth for every money calculation.
 *
 * Everything here is a PURE function over plain data so it can be unit-tested
 * without a database (spec §28 "centralize financial calculation logic", §36/§37).
 *
 * Money model (one bank account + physical cash held by the treasurer):
 *
 *   totalCash      = openingBalance + activeIncome - activeExpense
 *   undepositedCash = (active cash income still undeposited) - (active cash expenses)
 *   bankBalance     = totalCash - undepositedCash
 *
 * which is algebraically identical to:
 *   bankBalance = openingBalance + transfers-in + deposited-cash-in - transfer-expenses
 *
 * Cancelled transactions are excluded everywhere (spec §36.1).
 */

import { assertRupiah, sumRupiah } from "./money";
import type {
  DuesStatus,
  PaymentAllocation,
  Transaction,
  TransactionType,
} from "./types";

/** Minimal shape the balance engine needs from a transaction. */
export interface BalanceInput {
  transaction_type: TransactionType;
  amount: number;
  payment_method: "transfer" | "cash";
  cash_deposit_status: "not_applicable" | "undeposited" | "deposited";
  status: "active" | "cancelled";
}

export interface BalanceSummary {
  /** opening balance carried into the system (not counted as income) */
  openingBalance: number;
  /** sum of all active income (dues + other income) */
  totalIncome: number;
  /** sum of all active expenses */
  totalExpense: number;
  /** opening + income - expense */
  totalCash: number;
  /** cash physically held, not yet banked */
  undepositedCash: number;
  /** money currently in the bank account */
  bankBalance: number;
}

function isIncome(t: BalanceInput): boolean {
  return t.transaction_type === "dues" || t.transaction_type === "income";
}

/**
 * Compute the full balance summary from the opening balance and the complete
 * transaction list. Cancelled rows are ignored.
 */
export function computeBalances(
  openingBalance: number,
  transactions: BalanceInput[],
): BalanceSummary {
  assertRupiah(openingBalance, "openingBalance");

  const active = transactions.filter((t) => t.status === "active");

  const totalIncome = sumRupiah(active.filter(isIncome).map((t) => t.amount));
  const totalExpense = sumRupiah(
    active.filter((t) => t.transaction_type === "expense").map((t) => t.amount),
  );

  const totalCash = openingBalance + totalIncome - totalExpense;

  const undepositedCashIn = sumRupiah(
    active
      .filter(
        (t) =>
          isIncome(t) &&
          t.payment_method === "cash" &&
          t.cash_deposit_status === "undeposited",
      )
      .map((t) => t.amount),
  );

  // Cash expenses are paid out of physical cash on hand (spec §36.6).
  const cashExpense = sumRupiah(
    active
      .filter((t) => t.transaction_type === "expense" && t.payment_method === "cash")
      .map((t) => t.amount),
  );

  const undepositedCash = undepositedCashIn - cashExpense;
  const bankBalance = totalCash - undepositedCash;

  return {
    openingBalance,
    totalIncome,
    totalExpense,
    totalCash,
    undepositedCash,
    bankBalance,
  };
}

export interface PeriodReport {
  openingBalance: number; // total cash at the start of the period
  income: number;
  expense: number;
  closingBalance: number;
}

/**
 * Compute opening/closing figures for a reporting period (spec §30).
 * Opening balance = global opening + all active income before the period
 *                   - all active expense before the period.
 */
export function computePeriodReport(
  transactions: (BalanceInput & { transaction_date: string })[],
  globalOpeningBalance: number,
  startISO: string,
  endISO: string,
): PeriodReport {
  assertRupiah(globalOpeningBalance, "globalOpeningBalance");
  const active = transactions.filter((t) => t.status === "active");

  const before = active.filter((t) => t.transaction_date < startISO);
  const openingBalance =
    globalOpeningBalance +
    sumRupiah(before.filter(isIncome).map((t) => t.amount)) -
    sumRupiah(before.filter((t) => t.transaction_type === "expense").map((t) => t.amount));

  const inRange = active.filter((t) => t.transaction_date >= startISO && t.transaction_date <= endISO);
  const income = sumRupiah(inRange.filter(isIncome).map((t) => t.amount));
  const expense = sumRupiah(inRange.filter((t) => t.transaction_type === "expense").map((t) => t.amount));

  return { openingBalance, income, expense, closingBalance: openingBalance + income - expense };
}

/** Sum active income/expense within an inclusive ISO date range [start, end]. */
export function sumInRange(
  transactions: (BalanceInput & { transaction_date: string })[],
  type: "income" | "expense",
  startISO: string,
  endISO: string,
): number {
  const active = transactions.filter(
    (t) =>
      t.status === "active" &&
      t.transaction_date >= startISO &&
      t.transaction_date <= endISO &&
      (type === "income" ? isIncome(t) : t.transaction_type === "expense"),
  );
  return sumRupiah(active.map((t) => t.amount));
}

// ----------------------------------------------------------------------------
// Dues status engine (spec §18)
// ----------------------------------------------------------------------------

/** Decide a single member/period status from the obligation and amount paid. */
export function paymentStatus(obligation: number, paidAmount: number): DuesStatus {
  assertRupiah(obligation, "obligation");
  assertRupiah(paidAmount, "paidAmount");
  if (paidAmount <= 0) return "belum";
  if (paidAmount >= obligation) return "lunas";
  return "sebagian";
}

/** Allocation joined with its owning transaction status, for filtering cancelled rows. */
export interface AllocationWithStatus extends PaymentAllocation {
  transaction_status: "active" | "cancelled";
}

/**
 * Sum the valid (active) allocations for a member in a given dues period.
 * Cancelled dues payments do not count (spec §36.2, §36.7).
 */
export function paidForPeriod(
  allocations: AllocationWithStatus[],
  memberId: string,
  duesPeriodId: string,
): number {
  return sumRupiah(
    allocations
      .filter(
        (a) =>
          a.transaction_status === "active" &&
          a.member_id === memberId &&
          a.dues_period_id === duesPeriodId,
      )
      .map((a) => a.allocated_amount),
  );
}

export interface MemberPeriodStatus {
  memberId: string;
  duesPeriodId: string;
  obligation: number;
  paid: number;
  remaining: number;
  status: DuesStatus;
}

/** Build the full status for one member/period. */
export function memberPeriodStatus(
  allocations: AllocationWithStatus[],
  memberId: string,
  duesPeriodId: string,
  obligation: number,
): MemberPeriodStatus {
  const paid = paidForPeriod(allocations, memberId, duesPeriodId);
  const remaining = Math.max(0, obligation - paid);
  return {
    memberId,
    duesPeriodId,
    obligation,
    paid,
    remaining,
    status: paymentStatus(obligation, paid),
  };
}

/** Count members by status for a single period (used in dashboard cards). */
export function summarizePeriodStatuses(
  statuses: MemberPeriodStatus[],
): { lunas: number; sebagian: number; belum: number } {
  return statuses.reduce(
    (acc, s) => {
      acc[s.status] += 1;
      return acc;
    },
    { lunas: 0, sebagian: 0, belum: 0 },
  );
}

// ----------------------------------------------------------------------------
// Transaction codes (spec §26)
// ----------------------------------------------------------------------------

const CODE_PREFIX: Record<TransactionType, string> = {
  dues: "DUES",
  income: "IN",
  expense: "OUT",
};

/** Format a transaction code, e.g. formatTransactionCode("dues", 2026, 6, 1) → "DUES-202606-001". */
export function formatTransactionCode(
  type: TransactionType,
  year: number,
  month: number,
  sequence: number,
): string {
  const ym = `${year}${String(month).padStart(2, "0")}`;
  const seq = String(sequence).padStart(3, "0");
  return `${CODE_PREFIX[type]}-${ym}-${seq}`;
}

/**
 * Given the existing codes for a type+month, return the next sequence number.
 * Robust to gaps (uses max existing sequence + 1).
 */
export function nextSequence(existingCodes: string[], type: TransactionType, year: number, month: number): number {
  const prefix = `${CODE_PREFIX[type]}-${year}${String(month).padStart(2, "0")}-`;
  let max = 0;
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const n = parseInt(code.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return max + 1;
}

// ----------------------------------------------------------------------------
// Reconciliation (spec §29)
// ----------------------------------------------------------------------------

export interface ReconciliationResult {
  expectedBankBalance: number;
  actualBankBalance: number;
  undepositedCash: number;
  difference: number;
  matches: boolean;
}

export function reconcile(
  expectedBankBalance: number,
  actualBankBalance: number,
  undepositedCash: number,
): ReconciliationResult {
  assertRupiah(expectedBankBalance, "expectedBankBalance");
  assertRupiah(actualBankBalance, "actualBankBalance");
  const difference = actualBankBalance - expectedBankBalance;
  return {
    expectedBankBalance,
    actualBankBalance,
    undepositedCash,
    difference,
    matches: difference === 0,
  };
}

// ----------------------------------------------------------------------------
// Viewer visibility (spec §24, §36.9-11) — strip data members may not see.
// ----------------------------------------------------------------------------

/** A transaction as it is safely exposed to member (viewer) mode. */
export type ViewerTransaction = Omit<
  Transaction,
  "internal_note" | "cancellation_reason" | "created_by"
> & { proof_url: string | null };

/**
 * Filter + redact transactions for viewer mode. This is the server-side guard
 * that guarantees hidden transactions, hidden proofs and internal notes never
 * reach a member, regardless of what the frontend requests.
 */
export function toViewerTransactions(transactions: Transaction[]): ViewerTransaction[] {
  return transactions
    .filter((t) => t.status === "active" && t.visible_to_viewers)
    .map((t) => {
      const { internal_note, cancellation_reason, created_by, ...rest } = t;
      void internal_note;
      void cancellation_reason;
      void created_by;
      return {
        ...rest,
        // Drop the proof URL entirely unless the treasurer allowed it.
        proof_url: t.proof_visible_to_viewers ? t.proof_url : null,
        proof_title: t.proof_visible_to_viewers ? t.proof_title : null,
      };
    });
}
