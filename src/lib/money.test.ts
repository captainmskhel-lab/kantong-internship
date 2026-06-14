import { describe, it, expect } from "vitest";
import {
  rupiah,
  rupiahShort,
  formatNumberID,
  parseRupiah,
  sumRupiah,
  assertRupiah,
  toRupiah,
  MoneyError,
} from "./money";

describe("money formatting", () => {
  it("formats rupiah without a space after Rp", () => {
    expect(rupiah(4_800_000)).toBe("Rp4.800.000");
    expect(rupiah(100_000)).toBe("Rp100.000");
    expect(rupiah(0)).toBe("Rp0");
  });

  it("formats negative amounts", () => {
    expect(rupiah(-1_000)).toBe("-Rp1.000");
  });

  it("formats plain Indonesian numbers", () => {
    expect(formatNumberID(1_600_000)).toBe("1.600.000");
  });

  it("formats short amounts", () => {
    expect(rupiahShort(1_600_000)).toBe("Rp1,6jt");
    expect(rupiahShort(2_000_000)).toBe("Rp2jt");
    expect(rupiahShort(250_000)).toBe("Rp250rb");
  });
});

describe("parseRupiah", () => {
  it("parses formatted and raw input", () => {
    expect(parseRupiah("Rp1.500.000")).toBe(1_500_000);
    expect(parseRupiah("1500000")).toBe(1_500_000);
    expect(parseRupiah("1.500.000")).toBe(1_500_000);
    expect(parseRupiah(" 100000 ")).toBe(100_000);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseRupiah("")).toBeNull();
    expect(parseRupiah("abc")).toBeNull();
    expect(parseRupiah("12.34a")).toBeNull();
  });
});

describe("integer-rupiah guards (no floating point money, spec §36.12)", () => {
  it("rejects non-integer amounts", () => {
    expect(() => assertRupiah(100.5)).toThrow(MoneyError);
    expect(() => assertRupiah(Number.NaN)).toThrow(MoneyError);
  });

  it("sums exactly without float drift", () => {
    // 0.1 + 0.2 style drift can never occur because we only use integers.
    expect(sumRupiah([100_000, 100_000, 100_000])).toBe(300_000);
  });

  it("rounds external numeric input to whole rupiah", () => {
    expect(toRupiah(99_999.6)).toBe(100_000);
  });
});
