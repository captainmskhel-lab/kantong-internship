/**
 * types.ts — domain model shared by the financial engine, API layer and UI.
 * These mirror the database schema (see db/migrations) but are framework-agnostic
 * so the calculation core can be unit-tested without a database.
 */

export type TransactionType = "dues" | "income" | "expense";

export type PaymentMethod = "transfer" | "cash";

/**
 * Cash deposit lifecycle. Only meaningful for cash income.
 *  - not_applicable: transfers, or any non-cash row
 *  - undeposited:    cash physically held by the treasurer, not yet in the bank
 *  - deposited:      cash that has been paid into the bank account
 */
export type CashDepositStatus = "not_applicable" | "undeposited" | "deposited";

export type TransactionStatus = "active" | "cancelled";

/** Income classification for "other income" (non-dues). */
export type IncomeCategory =
  | "iuran_anggota"
  | "iuran_kegiatan"
  | "donasi"
  | "pengembalian_dana"
  | "pemasukan_lainnya";

/** Per-member, per-month dues payment status (spec §18). */
export type DuesStatus = "belum" | "sebagian" | "lunas";

export interface Member {
  id: string;
  order_number: number;
  full_name: string;
  active: boolean;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: string;
  organization_name: string;
  organization_subtitle: string;
  monthly_dues_amount: number;
  due_day: number;
  internship_start_date: string | null;
  internship_end_date: string | null;
  opening_balance: number;
  opening_balance_date: string | null;
  setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DuesPeriod {
  id: string;
  year: number;
  month: number; // 1-12
  amount_per_member: number;
  due_date: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  transaction_code: string;
  transaction_type: TransactionType;
  member_id: string | null;
  category_id: string | null;
  title: string;
  amount: number; // integer rupiah, always stored positive
  transaction_date: string; // ISO date (Asia/Jakarta)
  payment_method: PaymentMethod;
  cash_deposit_status: CashDepositStatus;
  recipient_or_source: string | null;
  description: string | null;
  internal_note: string | null;
  proof_url: string | null;
  proof_title: string | null;
  visible_to_viewers: boolean;
  proof_visible_to_viewers: boolean;
  status: TransactionStatus;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  id: string;
  transaction_id: string;
  member_id: string;
  dues_period_id: string;
  allocated_amount: number;
  created_at: string;
}

export interface Reconciliation {
  id: string;
  reconciliation_date: string;
  expected_bank_balance: number;
  actual_bank_balance: number;
  undeposited_cash: number;
  difference: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  type: "income" | "expense";
  name: string;
  active: boolean;
  created_at: string;
}
