/**
 * dates.ts — Asia/Jakarta dates with Indonesian formatting (spec §36.13).
 *
 * We store dates as plain ISO `YYYY-MM-DD` strings keyed to Asia/Jakarta. The
 * group operates entirely in WIB so a fixed offset keeps things simple and
 * avoids accidental UTC drift when recording "today".
 */

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const JAKARTA_TZ = "Asia/Jakarta";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const MONTHS_SHORT_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Current date as `YYYY-MM-DD` in Asia/Jakarta, independent of server TZ. */
export function todayJakartaISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA already yields YYYY-MM-DD
}

/** Current { year, month } (month 1-12) in Asia/Jakarta. */
export function currentYearMonthJakarta(): { year: number; month: number } {
  const iso = todayJakartaISO();
  const [y, m] = iso.split("-").map(Number);
  return { year: y, month: m };
}

/**
 * Safely normalize ANY date-like value coming from the database or settings into
 * a plain `YYYY-MM-DD` string, or `null`. Never throws.
 *
 * postgres.js returns `date` / `timestamp` columns as JS `Date` objects (not
 * strings), so calling `.split()` / `.slice()` on the raw value crashes. This is
 * the single safe entry point for every date field (spec: internship dates,
 * opening_balance_date, transaction/due/reconciliation dates).
 *
 * Handles: null/undefined, "YYYY-MM-DD", ISO timestamps, Date objects, epoch
 * numbers, and Supabase date/timestamptz values.
 */
export function toISODate(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : isoFromDateUTC(value);
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (s === "") return null;
    // Fast path: starts with a calendar date (date or ISO timestamp string).
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : isoFromDateUTC(d);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : isoFromDateUTC(d);
  }

  // Last resort: object that stringifies into something Date can parse.
  try {
    const d = new Date(value as string);
    return Number.isNaN(d.getTime()) ? null : isoFromDateUTC(d);
  } catch {
    return null;
  }
}

/** Format a Date's UTC calendar parts as YYYY-MM-DD (matches postgres.js `date` parsing). */
function isoFromDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/** Extract { year, month } (month 1-12) from any date-like value, or null. Never throws. */
export function toYearMonth(value: unknown): { year: number; month: number } | null {
  const iso = toISODate(value);
  if (!iso) return null;
  const [y, m] = iso.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  return { year: y, month: m };
}

/**
 * { year, month } from any date-like value, falling back to the current
 * Asia/Jakarta month when the value is missing or unparseable (spec req: never crash).
 */
export function toYearMonthOrCurrent(value: unknown): { year: number; month: number } {
  return toYearMonth(value) ?? currentYearMonthJakarta();
}

/** "14 Juni 2026" from an ISO date string. */
export function formatDateID(iso: string): string {
  try {
    return format(parseISO(iso), "d MMMM yyyy", { locale: idLocale });
  } catch {
    return iso;
  }
}

/** "14 Jun 2026" short form. */
export function formatDateShortID(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: idLocale });
  } catch {
    return iso;
  }
}

/** "Juni 2026" from a year + month (1-12). */
export function monthLabelID(year: number, month: number): string {
  return `${MONTHS_ID[month - 1] ?? "?"} ${year}`;
}

/** "Jun" from a month number (1-12). */
export function monthShortID(month: number): string {
  return MONTHS_SHORT_ID[month - 1] ?? "?";
}

/** "Jun 2026" short. */
export function monthLabelShortID(year: number, month: number): string {
  return `${monthShortID(month)} ${year}`;
}

/** Inclusive list of {year, month} between two periods (for the dues matrix). */
export function monthsBetween(
  start: { year: number; month: number },
  end: { year: number; month: number },
): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  let y = start.year;
  let m = start.month;
  // Guard against runaway loops on bad input.
  for (let i = 0; i < 600; i++) {
    out.push({ year: y, month: m });
    if (y === end.year && m === end.month) break;
    if (y > end.year || (y === end.year && m >= end.month)) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** First and last ISO day of a given month. */
export function monthRange(year: number, month: number): { start: string; end: string } {
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(lastDay).padStart(2, "0")}` };
}

/** Human timestamp like "14 Juni 2026, 21.40" for report footers. */
export function formatTimestampID(date = new Date()): string {
  const d = new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
  return d;
}
