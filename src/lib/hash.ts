/**
 * hash.ts — password & PIN hashing (spec §4).
 *
 * Uses bcrypt (bcryptjs) with a per-hash salt and a work factor of 12. We never
 * store plaintext and never expose hashes to the browser. bcryptjs is pure JS so
 * it builds cleanly on every platform (no native toolchain needed on Windows).
 */
import bcrypt from "bcryptjs";

const WORK_FACTOR = 12;

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, WORK_FACTOR);
}

export async function verifySecret(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/** A member PIN must be exactly six digits (spec §3B). */
export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/** Basic password policy used by setup + security settings. */
export function passwordIssue(password: string): string | null {
  if (password.length < 8) return "Password minimal 8 karakter.";
  if (!/[a-zA-Z]/.test(password)) return "Password harus mengandung huruf.";
  if (!/\d/.test(password)) return "Password harus mengandung angka.";
  return null;
}
