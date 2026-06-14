/**
 * repo.ts — data access layer. All SQL lives here so API routes and server
 * components share one consistent, typed surface. Money columns (bigint) are
 * converted to JS safe integers on the way out.
 */
import "server-only";
import { sql } from "./db";
import { formatTransactionCode, nextSequence } from "./finance";
import { toISODate } from "./dates";
import type {
  AppSettings,
  Category,
  DuesPeriod,
  Member,
  PaymentAllocation,
  Reconciliation,
  Transaction,
  TransactionType,
  PaymentMethod,
  CashDepositStatus,
} from "./types";

const num = (v: unknown): number => Number(v ?? 0);
const bool = (v: unknown): boolean => v === true || v === "true";
/** Wrap a value for sql.json() — our typed objects don't carry an index signature. */
const asJson = (v: unknown) => v as Parameters<typeof sql.json>[0];

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapMember(r: Record<string, unknown>): Member {
  return {
    id: String(r.id),
    order_number: num(r.order_number),
    full_name: String(r.full_name),
    active: bool(r.active),
    internal_note: (r.internal_note as string) ?? null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function mapSettings(r: Record<string, unknown>): AppSettings {
  return {
    id: String(r.id),
    organization_name: String(r.organization_name),
    organization_subtitle: String(r.organization_subtitle),
    monthly_dues_amount: num(r.monthly_dues_amount),
    due_day: num(r.due_day),
    internship_start_date: toISODate(r.internship_start_date),
    internship_end_date: toISODate(r.internship_end_date),
    opening_balance: num(r.opening_balance),
    opening_balance_date: toISODate(r.opening_balance_date),
    setup_completed: bool(r.setup_completed),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function mapTransaction(r: Record<string, unknown>): Transaction {
  return {
    id: String(r.id),
    transaction_code: String(r.transaction_code),
    transaction_type: r.transaction_type as TransactionType,
    member_id: (r.member_id as string) ?? null,
    category_id: (r.category_id as string) ?? null,
    title: String(r.title),
    amount: num(r.amount),
    transaction_date: toISODate(r.transaction_date) ?? "",
    payment_method: r.payment_method as PaymentMethod,
    cash_deposit_status: r.cash_deposit_status as CashDepositStatus,
    recipient_or_source: (r.recipient_or_source as string) ?? null,
    description: (r.description as string) ?? null,
    internal_note: (r.internal_note as string) ?? null,
    proof_url: (r.proof_url as string) ?? null,
    proof_title: (r.proof_title as string) ?? null,
    visible_to_viewers: bool(r.visible_to_viewers),
    proof_visible_to_viewers: bool(r.proof_visible_to_viewers),
    status: r.status as "active" | "cancelled",
    cancellation_reason: (r.cancellation_reason as string) ?? null,
    created_by: (r.created_by as string) ?? null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function mapAllocation(r: Record<string, unknown>): PaymentAllocation {
  return {
    id: String(r.id),
    transaction_id: String(r.transaction_id),
    member_id: String(r.member_id),
    dues_period_id: String(r.dues_period_id),
    allocated_amount: num(r.allocated_amount),
    created_at: String(r.created_at),
  };
}

function mapPeriod(r: Record<string, unknown>): DuesPeriod {
  return {
    id: String(r.id),
    year: num(r.year),
    month: num(r.month),
    amount_per_member: num(r.amount_per_member),
    due_date: toISODate(r.due_date),
    created_at: String(r.created_at),
  };
}

function mapCategory(r: Record<string, unknown>): Category {
  return {
    id: String(r.id),
    type: r.type as "income" | "expense",
    name: String(r.name),
    active: bool(r.active),
    created_at: String(r.created_at),
  };
}

// ---------------------------------------------------------------------------
// Settings & setup
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<AppSettings | null> {
  const rows = await sql`select * from app_settings order by created_at limit 1`;
  return rows[0] ? mapSettings(rows[0]) : null;
}

export async function updateSettings(patch: {
  organization_name?: string;
  monthly_dues_amount?: number;
  due_day?: number;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
  opening_balance?: number;
  opening_balance_date?: string | null;
}): Promise<AppSettings | null> {
  const current = await sql`select id from app_settings limit 1`;
  if (!current[0]) return null;
  const rows = await sql`
    update app_settings set
      organization_name = coalesce(${patch.organization_name ?? null}, organization_name),
      monthly_dues_amount = coalesce(${patch.monthly_dues_amount ?? null}, monthly_dues_amount),
      due_day = coalesce(${patch.due_day ?? null}, due_day),
      internship_start_date = ${patch.internship_start_date === undefined ? sql`internship_start_date` : patch.internship_start_date},
      internship_end_date = ${patch.internship_end_date === undefined ? sql`internship_end_date` : patch.internship_end_date},
      opening_balance = coalesce(${patch.opening_balance ?? null}, opening_balance),
      opening_balance_date = ${patch.opening_balance_date === undefined ? sql`opening_balance_date` : patch.opening_balance_date},
      updated_at = now()
    where id = ${current[0].id}
    returning *`;
  return rows[0] ? mapSettings(rows[0]) : null;
}

export async function isSetupCompleted(): Promise<boolean> {
  const rows = await sql`select setup_completed from app_settings limit 1`;
  const settingsDone = rows[0] ? bool(rows[0].setup_completed) : false;
  const admin = await sql`select 1 from admin_users limit 1`;
  const viewer = await sql`select 1 from viewer_access limit 1`;
  return settingsDone && admin.length > 0 && viewer.length > 0;
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export async function getMembers(includeInactive = true): Promise<Member[]> {
  const rows = includeInactive
    ? await sql`select * from members order by order_number`
    : await sql`select * from members where active = true order by order_number`;
  return rows.map(mapMember);
}

export async function getMemberById(id: string): Promise<Member | null> {
  const rows = await sql`select * from members where id = ${id} limit 1`;
  return rows[0] ? mapMember(rows[0]) : null;
}

export async function updateMember(
  id: string,
  patch: { full_name?: string; active?: boolean; internal_note?: string | null },
): Promise<Member | null> {
  const rows = await sql`
    update members set
      full_name = coalesce(${patch.full_name ?? null}, full_name),
      active = coalesce(${patch.active ?? null}, active),
      internal_note = ${patch.internal_note === undefined ? sql`internal_note` : patch.internal_note},
      updated_at = now()
    where id = ${id}
    returning *`;
  return rows[0] ? mapMember(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function getCategories(type?: "income" | "expense"): Promise<Category[]> {
  const rows = type
    ? await sql`select * from categories where type = ${type} and active = true order by name`
    : await sql`select * from categories where active = true order by type, name`;
  return rows.map(mapCategory);
}

// ---------------------------------------------------------------------------
// Dues periods
// ---------------------------------------------------------------------------
export async function getDuesPeriods(): Promise<DuesPeriod[]> {
  const rows = await sql`select * from dues_periods order by year, month`;
  return rows.map(mapPeriod);
}

/** Find or create the dues period for a year+month using current settings. */
export async function ensureDuesPeriod(year: number, month: number, amountPerMember: number, dueDate: string | null): Promise<DuesPeriod> {
  const existing = await sql`select * from dues_periods where year = ${year} and month = ${month} limit 1`;
  if (existing[0]) return mapPeriod(existing[0]);
  const rows = await sql`
    insert into dues_periods (year, month, amount_per_member, due_date)
    values (${year}, ${month}, ${amountPerMember}, ${dueDate})
    returning *`;
  return mapPeriod(rows[0]);
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
export async function getTransactions(opts?: { includeCancelled?: boolean }): Promise<Transaction[]> {
  const rows = opts?.includeCancelled
    ? await sql`select * from transactions order by transaction_date desc, created_at desc`
    : await sql`select * from transactions where status = 'active' order by transaction_date desc, created_at desc`;
  return rows.map(mapTransaction);
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const rows = await sql`select * from transactions where id = ${id} limit 1`;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

export async function getAllocations(): Promise<PaymentAllocation[]> {
  const rows = await sql`select * from payment_allocations order by created_at`;
  return rows.map(mapAllocation);
}

/** Allocations joined with the owning transaction status (for dues status engine). */
export async function getAllocationsWithStatus(): Promise<
  (PaymentAllocation & { transaction_status: "active" | "cancelled" })[]
> {
  const rows = await sql`
    select pa.*, t.status as transaction_status
    from payment_allocations pa
    join transactions t on t.id = pa.transaction_id`;
  return rows.map((r) => ({ ...mapAllocation(r), transaction_status: r.transaction_status as "active" | "cancelled" }));
}

async function nextCode(type: TransactionType, year: number, month: number): Promise<string> {
  const prefix = `${type === "dues" ? "DUES" : type === "income" ? "IN" : "OUT"}-${year}${String(month).padStart(2, "0")}-`;
  const rows = await sql<{ transaction_code: string }[]>`
    select transaction_code from transactions where transaction_code like ${prefix + "%"}`;
  const seq = nextSequence(rows.map((r) => r.transaction_code), type, year, month);
  return formatTransactionCode(type, year, month, seq);
}

export interface NewPaymentInput {
  memberId: string;
  duesPeriods: { year: number; month: number }[]; // one or more months covered
  amount: number; // total amount paid
  paymentMethod: PaymentMethod;
  cashDeposited: boolean; // only relevant for cash
  transactionDate: string;
  proofUrl: string | null;
  proofTitle: string | null;
  note: string | null;
  visibleToViewers: boolean;
  proofVisibleToViewers: boolean;
  monthlyDuesAmount: number;
  dueDay: number;
  createdBy: string;
  memberName: string;
}

/**
 * Record a dues payment, allocating the amount across one or more months.
 * Allocation strategy: fill each chosen month up to the monthly obligation in
 * order; any remainder lands on the last month (overpayment is allowed).
 */
export async function createDuesPayment(input: NewPaymentInput): Promise<Transaction> {
  const firstPeriod = input.duesPeriods[0];
  const code = await nextCode("dues", firstPeriod.year, firstPeriod.month);
  const cashStatus: CashDepositStatus =
    input.paymentMethod === "cash" ? (input.cashDeposited ? "deposited" : "undeposited") : "not_applicable";

  return (await sql.begin(async (tx) => {
    // Ensure all periods exist.
    const periodIds: string[] = [];
    for (const p of input.duesPeriods) {
      const dueDate = `${p.year}-${String(p.month).padStart(2, "0")}-${String(input.dueDay).padStart(2, "0")}`;
      const existing = await tx`select * from dues_periods where year = ${p.year} and month = ${p.month} limit 1`;
      if (existing[0]) {
        periodIds.push(String(existing[0].id));
      } else {
        const created = await tx`
          insert into dues_periods (year, month, amount_per_member, due_date)
          values (${p.year}, ${p.month}, ${input.monthlyDuesAmount}, ${dueDate}) returning id`;
        periodIds.push(String(created[0].id));
      }
    }

    const title = `Iuran ${input.memberName}`;
    const inserted = await tx`
      insert into transactions
        (transaction_code, transaction_type, member_id, title, amount, transaction_date,
         payment_method, cash_deposit_status, description, proof_url, proof_title,
         visible_to_viewers, proof_visible_to_viewers, created_by)
      values
        (${code}, 'dues', ${input.memberId}, ${title}, ${input.amount}, ${input.transactionDate},
         ${input.paymentMethod}, ${cashStatus}, ${input.note}, ${input.proofUrl}, ${input.proofTitle},
         ${input.visibleToViewers}, ${input.proofVisibleToViewers}, ${input.createdBy})
      returning *`;
    const transactionId = String(inserted[0].id);

    // Allocate across periods.
    let remaining = input.amount;
    for (let i = 0; i < periodIds.length; i++) {
      const isLast = i === periodIds.length - 1;
      const portion = isLast ? remaining : Math.min(remaining, input.monthlyDuesAmount);
      remaining -= portion;
      await tx`
        insert into payment_allocations (transaction_id, member_id, dues_period_id, allocated_amount)
        values (${transactionId}, ${input.memberId}, ${periodIds[i]}, ${portion})`;
      if (remaining <= 0 && !isLast) {
        // assign 0 to remaining periods
        for (let j = i + 1; j < periodIds.length; j++) {
          await tx`insert into payment_allocations (transaction_id, member_id, dues_period_id, allocated_amount)
                   values (${transactionId}, ${input.memberId}, ${periodIds[j]}, 0)`;
        }
        break;
      }
    }

    await tx`insert into transaction_audit_logs (transaction_id, action, new_data, performed_by)
             values (${transactionId}, 'create', ${tx.json(asJson(mapTransaction(inserted[0])))}, ${input.createdBy})`;

    return mapTransaction(inserted[0]);
  })) as Transaction;
}

export interface NewIncomeInput {
  title: string;
  categoryId: string | null;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  cashDeposited: boolean;
  source: string | null;
  proofUrl: string | null;
  proofTitle: string | null;
  note: string | null;
  internalNote: string | null;
  visibleToViewers: boolean;
  proofVisibleToViewers: boolean;
  createdBy: string;
}

export async function createIncome(input: NewIncomeInput): Promise<Transaction> {
  const [y, m] = input.date.split("-").map(Number);
  const code = await nextCode("income", y, m);
  const cashStatus: CashDepositStatus =
    input.paymentMethod === "cash" ? (input.cashDeposited ? "deposited" : "undeposited") : "not_applicable";
  const rows = await sql`
    insert into transactions
      (transaction_code, transaction_type, category_id, title, amount, transaction_date,
       payment_method, cash_deposit_status, recipient_or_source, description, internal_note,
       proof_url, proof_title, visible_to_viewers, proof_visible_to_viewers, created_by)
    values
      (${code}, 'income', ${input.categoryId}, ${input.title}, ${input.amount}, ${input.date},
       ${input.paymentMethod}, ${cashStatus}, ${input.source}, ${input.note}, ${input.internalNote},
       ${input.proofUrl}, ${input.proofTitle}, ${input.visibleToViewers}, ${input.proofVisibleToViewers}, ${input.createdBy})
    returning *`;
  return mapTransaction(rows[0]);
}

export interface NewExpenseInput {
  title: string;
  categoryId: string | null;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  recipient: string | null;
  proofUrl: string | null;
  proofTitle: string | null;
  description: string | null;
  internalNote: string | null;
  visibleToViewers: boolean;
  proofVisibleToViewers: boolean;
  createdBy: string;
}

export async function createExpense(input: NewExpenseInput): Promise<Transaction> {
  const [y, m] = input.date.split("-").map(Number);
  const code = await nextCode("expense", y, m);
  // Cash expenses reduce physical cash; status is informational only here.
  const cashStatus: CashDepositStatus = input.paymentMethod === "cash" ? "undeposited" : "not_applicable";
  const rows = await sql`
    insert into transactions
      (transaction_code, transaction_type, category_id, title, amount, transaction_date,
       payment_method, cash_deposit_status, recipient_or_source, description, internal_note,
       proof_url, proof_title, visible_to_viewers, proof_visible_to_viewers, created_by)
    values
      (${code}, 'expense', ${input.categoryId}, ${input.title}, ${input.amount}, ${input.date},
       ${input.paymentMethod}, ${cashStatus}, ${input.recipient}, ${input.description}, ${input.internalNote},
       ${input.proofUrl}, ${input.proofTitle}, ${input.visibleToViewers}, ${input.proofVisibleToViewers}, ${input.createdBy})
    returning *`;
  return mapTransaction(rows[0]);
}

export async function cancelTransaction(id: string, reason: string, by: string): Promise<Transaction | null> {
  const before = await getTransactionById(id);
  if (!before) return null;
  const rows = await sql`
    update transactions set status = 'cancelled', cancellation_reason = ${reason}, updated_at = now()
    where id = ${id} returning *`;
  await sql`insert into transaction_audit_logs (transaction_id, action, previous_data, new_data, reason, performed_by)
            values (${id}, 'cancel', ${sql.json(asJson(before))}, ${sql.json(asJson(mapTransaction(rows[0])))}, ${reason}, ${by})`;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

export async function updateTransactionVisibility(
  id: string,
  patch: { visible_to_viewers?: boolean; proof_visible_to_viewers?: boolean },
  by: string,
): Promise<Transaction | null> {
  const before = await getTransactionById(id);
  if (!before) return null;
  const rows = await sql`
    update transactions set
      visible_to_viewers = coalesce(${patch.visible_to_viewers ?? null}, visible_to_viewers),
      proof_visible_to_viewers = coalesce(${patch.proof_visible_to_viewers ?? null}, proof_visible_to_viewers),
      updated_at = now()
    where id = ${id} returning *`;
  await sql`insert into transaction_audit_logs (transaction_id, action, previous_data, new_data, performed_by)
            values (${id}, 'update_visibility', ${sql.json(asJson(before))}, ${sql.json(asJson(mapTransaction(rows[0])))}, ${by})`;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

export interface EditTransactionInput {
  amount?: number;
  transaction_date?: string;
  payment_method?: PaymentMethod;
  category_id?: string | null;
  proof_url?: string | null;
  proof_title?: string | null;
  description?: string | null;
  internal_note?: string | null;
  visible_to_viewers?: boolean;
  proof_visible_to_viewers?: boolean;
}

export async function editTransaction(
  id: string,
  patch: EditTransactionInput,
  reason: string,
  by: string,
): Promise<Transaction | null> {
  const before = await getTransactionById(id);
  if (!before) return null;
  const rows = await sql`
    update transactions set
      amount = coalesce(${patch.amount ?? null}, amount),
      transaction_date = coalesce(${patch.transaction_date ?? null}, transaction_date),
      payment_method = coalesce(${patch.payment_method ?? null}, payment_method),
      category_id = ${patch.category_id === undefined ? sql`category_id` : patch.category_id},
      proof_url = ${patch.proof_url === undefined ? sql`proof_url` : patch.proof_url},
      proof_title = ${patch.proof_title === undefined ? sql`proof_title` : patch.proof_title},
      description = ${patch.description === undefined ? sql`description` : patch.description},
      internal_note = ${patch.internal_note === undefined ? sql`internal_note` : patch.internal_note},
      visible_to_viewers = coalesce(${patch.visible_to_viewers ?? null}, visible_to_viewers),
      proof_visible_to_viewers = coalesce(${patch.proof_visible_to_viewers ?? null}, proof_visible_to_viewers),
      updated_at = now()
    where id = ${id} returning *`;
  await sql`insert into transaction_audit_logs (transaction_id, action, previous_data, new_data, reason, performed_by)
            values (${id}, 'edit', ${sql.json(asJson(before))}, ${sql.json(asJson(mapTransaction(rows[0])))}, ${reason}, ${by})`;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Cash deposits
// ---------------------------------------------------------------------------
export async function markCashDeposited(transactionId: string, by: string): Promise<Transaction | null> {
  const before = await getTransactionById(transactionId);
  if (!before || before.payment_method !== "cash" || before.cash_deposit_status === "deposited") return before;
  const rows = await sql.begin(async (tx) => {
    const updated = await tx`
      update transactions set cash_deposit_status = 'deposited', updated_at = now()
      where id = ${transactionId} returning *`;
    await tx`insert into cash_deposits (amount, deposit_date, note, created_by)
             values (${before.amount}, ${new Date().toISOString().slice(0, 10)}, ${"Setoran " + before.transaction_code}, ${by})`;
    return updated;
  });
  return rows[0] ? mapTransaction(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Reconciliations
// ---------------------------------------------------------------------------
export async function createReconciliation(input: {
  date: string;
  expected: number;
  actual: number;
  undeposited: number;
  note: string | null;
  by: string;
}): Promise<Reconciliation> {
  const difference = input.actual - input.expected;
  const rows = await sql`
    insert into reconciliations (reconciliation_date, expected_bank_balance, actual_bank_balance, undeposited_cash, difference, note, created_by)
    values (${input.date}, ${input.expected}, ${input.actual}, ${input.undeposited}, ${difference}, ${input.note}, ${input.by})
    returning *`;
  const r = rows[0];
  return {
    id: String(r.id),
    reconciliation_date: toISODate(r.reconciliation_date) ?? "",
    expected_bank_balance: num(r.expected_bank_balance),
    actual_bank_balance: num(r.actual_bank_balance),
    undeposited_cash: num(r.undeposited_cash),
    difference: num(r.difference),
    note: (r.note as string) ?? null,
    created_by: (r.created_by as string) ?? null,
    created_at: String(r.created_at),
  };
}

/**
 * Admin-only JSON backup (spec §31). Never includes password/PIN hashes,
 * session tokens or secret keys.
 */
export async function buildBackup(): Promise<Record<string, unknown>> {
  const [settings, members, periods, transactions, allocations, categories, reconciliations, deposits, reports] =
    await Promise.all([
      sql`select * from app_settings`,
      sql`select * from members order by order_number`,
      sql`select * from dues_periods order by year, month`,
      sql`select * from transactions order by created_at`,
      sql`select * from payment_allocations order by created_at`,
      sql`select * from categories order by type, name`,
      sql`select * from reconciliations order by created_at`,
      sql`select * from cash_deposits order by created_at`,
      sql`select id, report_type, period_start, period_end, version, generated_at, generated_by from reports order by generated_at`,
    ]);
  return {
    meta: {
      app: "Kantong Internship",
      version: 1,
      exported_at: new Date().toISOString(),
    },
    settings: settings.map((s) => ({ ...s })),
    members,
    dues_periods: periods,
    transactions,
    payment_allocations: allocations,
    categories,
    reconciliations,
    cash_deposits: deposits,
    reports,
  };
}

export async function getReconciliations(): Promise<Reconciliation[]> {
  const rows = await sql`select * from reconciliations order by reconciliation_date desc, created_at desc`;
  return rows.map((r) => ({
    id: String(r.id),
    reconciliation_date: toISODate(r.reconciliation_date) ?? "",
    expected_bank_balance: num(r.expected_bank_balance),
    actual_bank_balance: num(r.actual_bank_balance),
    undeposited_cash: num(r.undeposited_cash),
    difference: num(r.difference),
    note: (r.note as string) ?? null,
    created_by: (r.created_by as string) ?? null,
    created_at: String(r.created_at),
  }));
}
