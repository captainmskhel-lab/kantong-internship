import { describe, it, expect } from "vitest";
import { toISODate, toYearMonth, toYearMonthOrCurrent, currentYearMonthJakarta } from "./dates";

describe("toISODate — safe date normalization (DB returns Date objects)", () => {
  it("returns null for null/undefined", () => {
    expect(toISODate(null)).toBeNull();
    expect(toISODate(undefined)).toBeNull();
  });

  it("passes through a YYYY-MM-DD string", () => {
    expect(toISODate("2026-06-01")).toBe("2026-06-01");
  });

  it("trims an ISO timestamp string to the date", () => {
    expect(toISODate("2026-06-01T17:00:00.000Z")).toBe("2026-06-01");
    expect(toISODate("2026-06-01 00:00:00+07")).toBe("2026-06-01");
  });

  it("handles a JS Date object (postgres.js date column)", () => {
    expect(toISODate(new Date("2026-06-01T00:00:00Z"))).toBe("2026-06-01");
    expect(toISODate(new Date("2026-12-31T00:00:00Z"))).toBe("2026-12-31");
  });

  it("handles an epoch-millis number", () => {
    expect(toISODate(Date.UTC(2026, 5, 1))).toBe("2026-06-01");
  });

  it("returns null for unparseable / empty values", () => {
    expect(toISODate("")).toBeNull();
    expect(toISODate("   ")).toBeNull();
    expect(toISODate("bukan tanggal")).toBeNull();
    expect(toISODate(new Date("invalid"))).toBeNull();
    expect(toISODate({})).toBeNull();
  });
});

describe("toYearMonth", () => {
  it("extracts {year, month} from a string", () => {
    expect(toYearMonth("2026-06-01")).toEqual({ year: 2026, month: 6 });
  });

  it("extracts {year, month} from a Date object", () => {
    expect(toYearMonth(new Date("2026-12-15T00:00:00Z"))).toEqual({ year: 2026, month: 12 });
  });

  it("returns null for invalid input", () => {
    expect(toYearMonth(null)).toBeNull();
    expect(toYearMonth("not a date")).toBeNull();
  });
});

describe("toYearMonthOrCurrent — never crashes, falls back to current month", () => {
  it("parses a valid value", () => {
    expect(toYearMonthOrCurrent("2026-03-09")).toEqual({ year: 2026, month: 3 });
  });

  it("falls back to the current Asia/Jakarta month for invalid input", () => {
    const current = currentYearMonthJakarta();
    expect(toYearMonthOrCurrent(null)).toEqual(current);
    expect(toYearMonthOrCurrent("garbage")).toEqual(current);
    expect(toYearMonthOrCurrent(undefined)).toEqual(current);
  });
});
