/**
 * admin-reset.ts — emergency recovery for treasurer credentials & member PIN.
 *
 * Usage:  npm run admin:reset
 *
 * Requires ADMIN_RESET_SECRET to be set in the environment so the script cannot
 * be run casually. There is intentionally NO public forgot-password route (spec §4).
 * Securely resets: treasurer username, treasurer password, and the member PIN.
 */
import { config as loadEnv } from "dotenv";
// Load .env.local first (Next.js convention), then .env as a fallback.
loadEnv({ path: ".env.local" });
loadEnv();
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const WORK_FACTOR = 12;

function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/** Read a line without echoing it to the terminal (for password/PIN). */
async function readHidden(prompt: string): Promise<string> {
  stdout.write(prompt);
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  // Mute echo by overriding the output writer while the line is read.
  const orig = (rl as unknown as { _writeToOutput?: (s: string) => void })._writeToOutput;
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
    if (s.includes("\n") || s.includes("\r")) stdout.write(s);
  };
  try {
    const answer = await rl.question("");
    return answer;
  } finally {
    if (orig) (rl as unknown as { _writeToOutput?: (s: string) => void })._writeToOutput = orig;
    rl.close();
    stdout.write("\n");
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✖ DATABASE_URL is not set.");
    process.exit(1);
  }
  if (!process.env.ADMIN_RESET_SECRET) {
    console.error(
      "✖ ADMIN_RESET_SECRET is not set. Set it in .env.local before running the recovery script.",
    );
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  console.log("\n=== Kantong Internship — pemulihan kredensial bendahara ===\n");
  const provided = await rl.question("Masukkan ADMIN_RESET_SECRET untuk konfirmasi: ");
  rl.close();
  if (provided.trim() !== process.env.ADMIN_RESET_SECRET) {
    console.error("✖ Secret tidak cocok. Dibatalkan.");
    process.exit(1);
  }

  const rl2 = createInterface({ input: stdin, output: stdout });
  const username = (await rl2.question("Username bendahara baru [bendahara]: ")).trim() || "bendahara";
  rl2.close();

  const password = await readHidden("Password bendahara baru (min 8, ada huruf & angka): ");
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    console.error("✖ Password tidak memenuhi syarat.");
    process.exit(1);
  }
  const confirmPassword = await readHidden("Ulangi password: ");
  if (password !== confirmPassword) {
    console.error("✖ Password tidak sama.");
    process.exit(1);
  }

  const pin = await readHidden("PIN anggota baru (6 digit): ");
  if (!isValidPin(pin)) {
    console.error("✖ PIN harus tepat 6 digit angka.");
    process.exit(1);
  }
  const confirmPin = await readHidden("Ulangi PIN: ");
  if (pin !== confirmPin) {
    console.error("✖ PIN tidak sama.");
    process.exit(1);
  }

  const ssl = /supabase\.(co|com)/.test(url) || /sslmode=require/.test(url) ? ("require" as const) : undefined;
  const sql = postgres(url, { max: 1, prepare: false, ssl });
  try {
    const passwordHash = await bcrypt.hash(password, WORK_FACTOR);
    const pinHash = await bcrypt.hash(pin, WORK_FACTOR);

    await sql.begin(async (tx) => {
      const existing = await tx`select id from admin_users limit 1`;
      if (existing.length > 0) {
        await tx`update admin_users set username = ${username}, password_hash = ${passwordHash}, active = true, updated_at = now() where id = ${existing[0].id}`;
      } else {
        await tx`insert into admin_users (username, password_hash) values (${username}, ${passwordHash})`;
      }

      const viewer = await tx`select id from viewer_access limit 1`;
      if (viewer.length > 0) {
        await tx`update viewer_access set pin_hash = ${pinHash}, updated_at = now() where id = ${viewer[0].id}`;
      } else {
        await tx`insert into viewer_access (pin_hash) values (${pinHash})`;
      }

      // Ensure the app is marked set up so login works after recovery.
      const settings = await tx`select id from app_settings limit 1`;
      if (settings.length > 0) {
        await tx`update app_settings set setup_completed = true, updated_at = now() where id = ${settings[0].id}`;
      }
    });

    console.log("\n✓ Kredensial berhasil direset.");
    console.log(`  Username : ${username}`);
    console.log("  Password : (tersimpan dalam bentuk hash)");
    console.log("  PIN      : (tersimpan dalam bentuk hash)\n");
  } catch (err) {
    console.error("✖ Gagal mereset kredensial:", err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
