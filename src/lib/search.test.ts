import { describe, it, expect } from "vitest";
import {
  runSearch,
  buildReportSearchEntries,
  type SearchDataset,
  type SearchTransactionInput,
  type SearchMemberInput,
} from "./search";

function member(p: Partial<SearchMemberInput>): SearchMemberInput {
  return { id: "m1", full_name: "dr. Orion", order_number: 1, active: true, ...p };
}

function tx(p: Partial<SearchTransactionInput>): SearchTransactionInput {
  return {
    id: "t1",
    transaction_code: "DUES-202606-001",
    transaction_type: "dues",
    title: "Iuran dr. Orion",
    member_name: "dr. Orion",
    category_name: null,
    amount: 100_000,
    transaction_date: "2026-06-14",
    payment_method: "transfer",
    description: null,
    internal_note: null,
    status: "active",
    ...p,
  };
}

function dataset(p: Partial<SearchDataset>): SearchDataset {
  return { members: [], transactions: [], reports: [], ...p };
}

const flat = (r: ReturnType<typeof runSearch>) => r.groups.flatMap((g) => g.items);

describe("runSearch — query basics", () => {
  it("returns nothing for an empty query", () => {
    const r = runSearch("", dataset({ members: [member({})] }), { scope: "admin" });
    expect(r.total).toBe(0);
    expect(r.groups).toHaveLength(0);
  });

  it("searches by member name", () => {
    const r = runSearch("orion", dataset({ members: [member({}), member({ id: "m2", full_name: "dr. Dicky" })] }), {
      scope: "admin",
    });
    const anggota = r.groups.find((g) => g.key === "anggota");
    expect(anggota?.items.map((i) => i.title)).toEqual(["dr. Orion"]);
  });

  it("searches by transaction code (exact match scores highest)", () => {
    const r = runSearch("DUES-202606-001", dataset({ transactions: [tx({})] }), { scope: "admin" });
    const hit = flat(r)[0];
    expect(hit.code).toBe("DUES-202606-001");
    expect(hit.group).toBe("pembayaran");
  });

  it("searches by category (expense)", () => {
    const r = runSearch("konsumsi", dataset({
      transactions: [tx({ id: "e1", transaction_type: "expense", transaction_code: "OUT-202606-001", title: "Konsumsi rapat", category_name: "Konsumsi", member_name: null })],
    }), { scope: "admin" });
    expect(r.groups.find((g) => g.key === "pengeluaran")?.items).toHaveLength(1);
  });

  it("searches by amount", () => {
    const r = runSearch("100000", dataset({ transactions: [tx({})] }), { scope: "admin" });
    expect(flat(r)).toHaveLength(1);
    const r2 = runSearch("100.000", dataset({ transactions: [tx({})] }), { scope: "admin" });
    expect(flat(r2)).toHaveLength(1);
  });

  it("searches by dues period label", () => {
    const r = runSearch("juni 2026", dataset({ transactions: [tx({})] }), { scope: "admin" });
    expect(flat(r)).toHaveLength(1);
  });

  it("requires all tokens to match (AND)", () => {
    const r = runSearch("orion juli", dataset({ transactions: [tx({})] }), { scope: "admin" });
    expect(flat(r)).toHaveLength(0);
  });

  it("excludes cancelled transactions", () => {
    const r = runSearch("orion", dataset({ transactions: [tx({ status: "cancelled" })] }), { scope: "admin" });
    expect(r.groups.find((g) => g.key === "pembayaran")).toBeUndefined();
  });
});

describe("runSearch — scope & security (spec §9, §14)", () => {
  it("admin search can match an internal note", () => {
    const r = runSearch("rahasia", dataset({ transactions: [tx({ internal_note: "catatan RAHASIA bendahara" })] }), {
      scope: "admin",
    });
    expect(flat(r)).toHaveLength(1);
  });

  it("viewer search never matches internal notes, even if present in input", () => {
    // Defence in depth: even if a note leaked into the input, viewer scope won't search it.
    const r = runSearch("rahasia", dataset({ transactions: [tx({ internal_note: "catatan RAHASIA bendahara" })] }), {
      scope: "viewer",
    });
    expect(flat(r)).toHaveLength(0);
  });

  it("viewer search never matches descriptions/notes", () => {
    const r = runSearch("memo", dataset({ transactions: [tx({ description: "memo internal" })] }), { scope: "viewer" });
    expect(flat(r)).toHaveLength(0);
    // admin can still find it
    const r2 = runSearch("memo", dataset({ transactions: [tx({ description: "memo internal" })] }), { scope: "admin" });
    expect(flat(r2)).toHaveLength(1);
  });

  it("hidden transactions are absent when the caller (service) omits them", () => {
    // The service builds viewer data from visible transactions only — simulate that.
    const visibleOnly = dataset({ transactions: [tx({ id: "visible", member_name: "dr. Orion" })] });
    const r = runSearch("orion", visibleOnly, { scope: "viewer" });
    expect(flat(r).some((h) => h.id === "hidden")).toBe(false);
    expect(flat(r)).toHaveLength(1);
  });

  it("never returns Laporan results for viewers (reports are admin-only)", () => {
    const data = dataset({ reports: buildReportSearchEntries(["2026-06-14"]) });
    const adminR = runSearch("laporan", data, { scope: "admin" });
    expect(adminR.groups.find((g) => g.key === "laporan")).toBeDefined();
    const viewerR = runSearch("laporan", data, { scope: "viewer" });
    expect(viewerR.groups.find((g) => g.key === "laporan")).toBeUndefined();
  });

  it("routes member results to the right page per scope", () => {
    const admin = runSearch("orion", dataset({ members: [member({})] }), { scope: "admin" });
    expect(flat(admin)[0].href).toContain("/admin/anggota");
    const viewer = runSearch("orion", dataset({ members: [member({})] }), { scope: "viewer" });
    expect(flat(viewer)[0].href).toBe("/lihat/iuran");
  });
});

describe("buildReportSearchEntries", () => {
  it("creates a monthly entry per data month plus weekly/excel/backup", () => {
    const entries = buildReportSearchEntries(["2026-06-14", "2026-06-20", "2026-05-02"]);
    const monthly = entries.filter((e) => e.id.startsWith("report-monthly-"));
    expect(monthly).toHaveLength(2); // June + May
    expect(entries.some((e) => e.id === "report-excel")).toBe(true);
    expect(entries.some((e) => e.id === "report-weekly")).toBe(true);
  });
});
