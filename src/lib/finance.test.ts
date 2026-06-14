import { describe, it, expect } from "vitest";
import {
  computeBalances,
  computePeriodReport,
  paymentStatus,
  paidForPeriod,
  memberPeriodStatus,
  summarizePeriodStatuses,
  formatTransactionCode,
  nextSequence,
  reconcile,
  toViewerTransactions,
  type BalanceInput,
  type AllocationWithStatus,
} from "./finance";
import type { Transaction } from "./types";

/** Build a balance-input row with sensible defaults. */
function tx(partial: Partial<BalanceInput>): BalanceInput {
  return {
    transaction_type: "income",
    amount: 0,
    payment_method: "transfer",
    cash_deposit_status: "not_applicable",
    status: "active",
    ...partial,
  };
}

describe("computeBalances — core money rules (spec §28, §36)", () => {
  it("opening balance is not income but is part of total cash (§36.3)", () => {
    const b = computeBalances(500_000, []);
    expect(b.totalIncome).toBe(0);
    expect(b.totalCash).toBe(500_000);
    expect(b.bankBalance).toBe(500_000);
    expect(b.undepositedCash).toBe(0);
  });

  it("transfer income increases bank balance and total", () => {
    const b = computeBalances(0, [tx({ transaction_type: "dues", amount: 100_000 })]);
    expect(b.totalCash).toBe(100_000);
    expect(b.bankBalance).toBe(100_000);
    expect(b.undepositedCash).toBe(0);
  });

  it("undeposited cash increases total but not bank (§36.4)", () => {
    const b = computeBalances(0, [
      tx({ transaction_type: "dues", amount: 200_000, payment_method: "cash", cash_deposit_status: "undeposited" }),
    ]);
    expect(b.totalCash).toBe(200_000);
    expect(b.undepositedCash).toBe(200_000);
    expect(b.bankBalance).toBe(0);
  });

  it("matches the spec dashboard example (4.6jt bank + 200rb cash = 4.8jt)", () => {
    const b = computeBalances(0, [
      tx({ transaction_type: "dues", amount: 4_600_000, payment_method: "transfer" }),
      tx({ transaction_type: "dues", amount: 200_000, payment_method: "cash", cash_deposit_status: "undeposited" }),
    ]);
    expect(b.bankBalance).toBe(4_600_000);
    expect(b.undepositedCash).toBe(200_000);
    expect(b.totalCash).toBe(4_800_000);
  });

  it("depositing cash does not create income, only moves cash to bank (§36.5)", () => {
    const undeposited = computeBalances(0, [
      tx({ transaction_type: "dues", amount: 200_000, payment_method: "cash", cash_deposit_status: "undeposited" }),
    ]);
    const deposited = computeBalances(0, [
      tx({ transaction_type: "dues", amount: 200_000, payment_method: "cash", cash_deposit_status: "deposited" }),
    ]);
    // Total cash & income are identical; only the bank/undeposited split changes.
    expect(deposited.totalCash).toBe(undeposited.totalCash);
    expect(deposited.totalIncome).toBe(undeposited.totalIncome);
    expect(deposited.bankBalance).toBe(200_000);
    expect(deposited.undepositedCash).toBe(0);
  });

  it("transfer expense reduces bank and total", () => {
    const b = computeBalances(1_000_000, [tx({ transaction_type: "expense", amount: 250_000 })]);
    expect(b.totalCash).toBe(750_000);
    expect(b.bankBalance).toBe(750_000);
  });

  it("cash expense reduces physical cash, not the bank (§36.6)", () => {
    const b = computeBalances(0, [
      tx({ transaction_type: "dues", amount: 200_000, payment_method: "cash", cash_deposit_status: "undeposited" }),
      tx({ transaction_type: "expense", amount: 50_000, payment_method: "cash" }),
    ]);
    expect(b.totalCash).toBe(150_000);
    expect(b.undepositedCash).toBe(150_000);
    expect(b.bankBalance).toBe(0);
  });

  it("cancelled transactions do not affect balances (§36.1)", () => {
    const b = computeBalances(0, [
      tx({ transaction_type: "dues", amount: 100_000, status: "active" }),
      tx({ transaction_type: "dues", amount: 999_000, status: "cancelled" }),
      tx({ transaction_type: "expense", amount: 999_000, status: "cancelled" }),
    ]);
    expect(b.totalCash).toBe(100_000);
    expect(b.totalIncome).toBe(100_000);
    expect(b.totalExpense).toBe(0);
  });
});

describe("computePeriodReport — report totals (spec §30, §37)", () => {
  function dtx(p: Partial<BalanceInput & { transaction_date: string }>): BalanceInput & { transaction_date: string } {
    return {
      transaction_type: "income",
      amount: 0,
      payment_method: "transfer",
      cash_deposit_status: "not_applicable",
      status: "active",
      transaction_date: "2026-06-10",
      ...p,
    };
  }

  it("carries prior activity into the opening balance and computes closing", () => {
    const txs = [
      dtx({ transaction_type: "dues", amount: 300_000, transaction_date: "2026-05-20" }), // before June
      dtx({ transaction_type: "expense", amount: 100_000, transaction_date: "2026-05-25" }),
      dtx({ transaction_type: "dues", amount: 1_600_000, transaction_date: "2026-06-10" }), // in June
      dtx({ transaction_type: "expense", amount: 250_000, transaction_date: "2026-06-15" }),
      dtx({ transaction_type: "dues", amount: 999_000, transaction_date: "2026-07-01" }), // after June (ignored)
    ];
    const r = computePeriodReport(txs, 500_000, "2026-06-01", "2026-06-30");
    expect(r.openingBalance).toBe(500_000 + 300_000 - 100_000); // 700_000
    expect(r.income).toBe(1_600_000);
    expect(r.expense).toBe(250_000);
    expect(r.closingBalance).toBe(700_000 + 1_600_000 - 250_000); // 2_050_000
  });
});

describe("paymentStatus (spec §18)", () => {
  it("returns belum when nothing is paid", () => {
    expect(paymentStatus(100_000, 0)).toBe("belum");
  });
  it("returns sebagian for a partial payment", () => {
    expect(paymentStatus(100_000, 60_000)).toBe("sebagian");
  });
  it("returns lunas when fully (or over) paid", () => {
    expect(paymentStatus(100_000, 100_000)).toBe("lunas");
    expect(paymentStatus(100_000, 150_000)).toBe("lunas");
  });
});

describe("dues allocations (spec §18, §36.2, §36.7)", () => {
  function alloc(p: Partial<AllocationWithStatus>): AllocationWithStatus {
    return {
      id: Math.random().toString(),
      transaction_id: "t",
      member_id: "m1",
      dues_period_id: "p1",
      allocated_amount: 0,
      created_at: "",
      transaction_status: "active",
      ...p,
    };
  }

  it("sums multiple payments for one month", () => {
    const allocs = [alloc({ allocated_amount: 60_000 }), alloc({ allocated_amount: 40_000 })];
    expect(paidForPeriod(allocs, "m1", "p1")).toBe(100_000);
    expect(memberPeriodStatus(allocs, "m1", "p1", 100_000).status).toBe("lunas");
  });

  it("supports one payment split across multiple months", () => {
    const allocs = [
      alloc({ dues_period_id: "p1", allocated_amount: 100_000 }),
      alloc({ dues_period_id: "p2", allocated_amount: 100_000 }),
    ];
    expect(memberPeriodStatus(allocs, "m1", "p1", 100_000).status).toBe("lunas");
    expect(memberPeriodStatus(allocs, "m1", "p2", 100_000).status).toBe("lunas");
  });

  it("ignores cancelled dues payments", () => {
    const allocs = [
      alloc({ allocated_amount: 100_000, transaction_status: "cancelled" }),
      alloc({ allocated_amount: 30_000, transaction_status: "active" }),
    ];
    expect(paidForPeriod(allocs, "m1", "p1")).toBe(30_000);
    expect(memberPeriodStatus(allocs, "m1", "p1", 100_000).status).toBe("sebagian");
  });

  it("summarizes counts per status", () => {
    const statuses = [
      memberPeriodStatus([], "m1", "p1", 100_000), // belum
      memberPeriodStatus([alloc({ member_id: "m2", allocated_amount: 100_000 })], "m2", "p1", 100_000), // lunas
      memberPeriodStatus([alloc({ member_id: "m3", allocated_amount: 50_000 })], "m3", "p1", 100_000), // sebagian
    ];
    expect(summarizePeriodStatuses(statuses)).toEqual({ lunas: 1, sebagian: 1, belum: 1 });
  });
});

describe("transaction codes (spec §26)", () => {
  it("formats codes per type", () => {
    expect(formatTransactionCode("dues", 2026, 6, 1)).toBe("DUES-202606-001");
    expect(formatTransactionCode("income", 2026, 6, 12)).toBe("IN-202606-012");
    expect(formatTransactionCode("expense", 2026, 11, 3)).toBe("OUT-202611-003");
  });

  it("computes the next sequence from existing codes", () => {
    const existing = ["DUES-202606-001", "DUES-202606-002", "IN-202606-001"];
    expect(nextSequence(existing, "dues", 2026, 6)).toBe(3);
    expect(nextSequence(existing, "income", 2026, 6)).toBe(2);
    expect(nextSequence(existing, "expense", 2026, 6)).toBe(1);
  });
});

describe("reconciliation (spec §29)", () => {
  it("reports a match when balances are equal", () => {
    const r = reconcile(4_600_000, 4_600_000, 200_000);
    expect(r.matches).toBe(true);
    expect(r.difference).toBe(0);
  });
  it("reports the difference when balances differ", () => {
    const r = reconcile(4_600_000, 4_550_000, 200_000);
    expect(r.matches).toBe(false);
    expect(r.difference).toBe(-50_000);
  });
});

describe("viewer visibility (spec §24, §36.9-11)", () => {
  function fullTx(p: Partial<Transaction>): Transaction {
    return {
      id: "t",
      transaction_code: "IN-202606-001",
      transaction_type: "income",
      member_id: null,
      category_id: null,
      title: "Donasi",
      amount: 100_000,
      transaction_date: "2026-06-14",
      payment_method: "transfer",
      cash_deposit_status: "not_applicable",
      recipient_or_source: null,
      description: null,
      internal_note: "RAHASIA bendahara",
      proof_url: "https://drive.google.com/file/d/ABC/view",
      proof_title: "Bukti",
      visible_to_viewers: true,
      proof_visible_to_viewers: true,
      status: "active",
      cancellation_reason: null,
      created_by: "admin",
      created_at: "",
      updated_at: "",
      ...p,
    };
  }

  it("never leaks internal notes to viewers", () => {
    const out = toViewerTransactions([fullTx({})]);
    expect(out).toHaveLength(1);
    expect((out[0] as Record<string, unknown>).internal_note).toBeUndefined();
    expect((out[0] as Record<string, unknown>).cancellation_reason).toBeUndefined();
  });

  it("hides transactions flagged not visible (§36.9)", () => {
    const out = toViewerTransactions([fullTx({ visible_to_viewers: false })]);
    expect(out).toHaveLength(0);
  });

  it("hides cancelled transactions from viewers", () => {
    const out = toViewerTransactions([fullTx({ status: "cancelled" })]);
    expect(out).toHaveLength(0);
  });

  it("strips the proof URL when proof is not shared (§36.10)", () => {
    const out = toViewerTransactions([fullTx({ proof_visible_to_viewers: false })]);
    expect(out[0].proof_url).toBeNull();
    expect(out[0].proof_title).toBeNull();
  });

  it("keeps the proof URL when sharing is allowed", () => {
    const out = toViewerTransactions([fullTx({ proof_visible_to_viewers: true })]);
    expect(out[0].proof_url).toContain("drive.google.com");
  });
});
