/**
 * money.ts — integer-rupiah arithmetic and formatting.
 *
 * Money is always represented as a whole number of rupiah (no decimals, no cents).
 * Indonesian rupiah has no sub-unit in practice for this group's cash, so we keep
 * everything as JavaScript safe integers and NEVER use floating-point math for money.
 *
 * Financial rule (spec §36.12): store money as integer rupiah.
 */

/** Largest rupiah amount we accept — guards against overflow / typos. */
export const MAX_RUPIAH = 1_000_000_000_000; // 1 trillion rupiah, far beyond group needs

export class MoneyError extends Error {}

/** Assert a value is a safe, whole-rupiah integer. Throws otherwise. */
export function assertRupiah(value: number, label = "amount"): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MoneyError(`${label} must be a finite number`);
  }
  if (!Number.isInteger(value)) {
    throw new MoneyError(`${label} must be a whole rupiah integer (got ${value})`);
  }
  if (Math.abs(value) > MAX_RUPIAH) {
    throw new MoneyError(`${label} is out of range`);
  }
  return value;
}

/** Coerce an unknown numeric input into a whole-rupiah integer (rounding to nearest). */
export function toRupiah(value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MoneyError("value must be a finite number");
  }
  return Math.round(value);
}

/** Exact integer sum. */
export function sumRupiah(values: number[]): number {
  return values.reduce((acc, v) => acc + assertRupiah(v), 0);
}

/**
 * Parse a user-typed rupiah string ("Rp1.500.000", "1500000", "1.500.000")
 * into an integer. Returns null when the input is empty or not a number.
 */
export function parseRupiah(input: string): number | null {
  if (input == null) return null;
  const cleaned = String(input)
    .replace(/rp/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "") // Indonesian thousands separator
    .replace(/,/g, "") // ignore any comma grouping
    .trim();
  if (cleaned === "" || cleaned === "-") return null;
  if (!/^-?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

/** Format a number with Indonesian thousands separators ("4.800.000"). */
export function formatNumberID(value: number): string {
  const n = Math.trunc(value);
  return new Intl.NumberFormat("id-ID").format(n);
}

/**
 * Format an integer rupiah amount as "Rp4.800.000" (no space after Rp, to match
 * the brand style in the spec). Negative amounts render as "-Rp1.000".
 */
export function rupiah(value: number): string {
  const negative = value < 0;
  const formatted = formatNumberID(Math.abs(Math.trunc(value)));
  return `${negative ? "-" : ""}Rp${formatted}`;
}

/** Short rupiah for tight spaces: Rp1,6jt / Rp250rb. Used in compact chart labels. */
export function rupiahShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}Rp${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1).replace(".", ",")}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp${Math.round(abs / 1_000)}rb`;
  }
  return rupiah(value);
}
