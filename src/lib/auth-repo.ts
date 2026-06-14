/**
 * auth-repo.ts — credential storage & first-time setup (spec §4, §33, §34).
 * Hashes never leave the server.
 */
import "server-only";
import { sql } from "./db";
import { hashSecret, verifySecret } from "./hash";

export interface AdminCredential {
  id: string;
  username: string;
  password_hash: string;
  active: boolean;
}

export async function getAdminByUsername(username: string): Promise<AdminCredential | null> {
  const rows = await sql`select id, username, password_hash, active from admin_users where lower(username) = lower(${username}) limit 1`;
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    username: String(rows[0].username),
    password_hash: String(rows[0].password_hash),
    active: rows[0].active === true,
  };
}

export async function getAdminById(id: string): Promise<AdminCredential | null> {
  const rows = await sql`select id, username, password_hash, active from admin_users where id = ${id} limit 1`;
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    username: String(rows[0].username),
    password_hash: String(rows[0].password_hash),
    active: rows[0].active === true,
  };
}

export async function verifyViewerPin(pin: string): Promise<boolean> {
  const rows = await sql`select pin_hash from viewer_access order by updated_at desc limit 1`;
  if (!rows[0]) return false;
  return verifySecret(pin, String(rows[0].pin_hash));
}

// --- Security settings (spec §34) ---
export async function changeUsername(adminId: string, currentPassword: string, newUsername: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminById(adminId);
  if (!admin) return { ok: false, error: "Akun tidak ditemukan." };
  if (!(await verifySecret(currentPassword, admin.password_hash))) {
    return { ok: false, error: "Password saat ini belum cocok." };
  }
  const taken = await sql`select 1 from admin_users where lower(username) = lower(${newUsername}) and id <> ${adminId} limit 1`;
  if (taken.length > 0) return { ok: false, error: "Username sudah dipakai." };
  await sql`update admin_users set username = ${newUsername}, updated_at = now() where id = ${adminId}`;
  return { ok: true };
}

export async function changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminById(adminId);
  if (!admin) return { ok: false, error: "Akun tidak ditemukan." };
  if (!(await verifySecret(currentPassword, admin.password_hash))) {
    return { ok: false, error: "Password saat ini belum cocok." };
  }
  const hash = await hashSecret(newPassword);
  await sql`update admin_users set password_hash = ${hash}, updated_at = now() where id = ${adminId}`;
  return { ok: true };
}

export async function changePin(adminId: string, currentPassword: string, newPin: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminById(adminId);
  if (!admin) return { ok: false, error: "Akun tidak ditemukan." };
  if (!(await verifySecret(currentPassword, admin.password_hash))) {
    return { ok: false, error: "Password bendahara belum cocok." };
  }
  const hash = await hashSecret(newPin);
  const existing = await sql`select id from viewer_access limit 1`;
  if (existing[0]) {
    await sql`update viewer_access set pin_hash = ${hash}, updated_at = now() where id = ${existing[0].id}`;
  } else {
    await sql`insert into viewer_access (pin_hash) values (${hash})`;
  }
  return { ok: true };
}

// --- First-time setup (spec §33) ---
export interface SetupInput {
  organizationName: string;
  monthlyDuesAmount: number;
  dueDay: number;
  startMonth: { year: number; month: number };
  openingBalance: number;
  openingBalanceDate: string | null;
  internshipStartDate: string | null;
  internshipEndDate: string | null;
  username: string;
  password: string;
  pin: string;
}

export async function completeSetup(input: SetupInput): Promise<{ ok: boolean; error?: string }> {
  const done = await sql`select setup_completed from app_settings limit 1`;
  const adminExists = await sql`select 1 from admin_users limit 1`;
  if (done[0]?.setup_completed === true && adminExists.length > 0) {
    return { ok: false, error: "Setup sudah pernah diselesaikan." };
  }

  const passwordHash = await hashSecret(input.password);
  const pinHash = await hashSecret(input.pin);

  await sql.begin(async (tx) => {
    const settings = await tx`select id from app_settings order by created_at asc limit 1`;
    if (settings[0]) {
      await tx`update app_settings set
        organization_name = ${input.organizationName},
        monthly_dues_amount = ${input.monthlyDuesAmount},
        due_day = ${input.dueDay},
        opening_balance = ${input.openingBalance},
        opening_balance_date = ${input.openingBalanceDate},
        internship_start_date = ${input.internshipStartDate},
        internship_end_date = ${input.internshipEndDate},
        setup_completed = true,
        updated_at = now()
        where id = ${settings[0].id}`;
    } else {
      await tx`insert into app_settings
        (organization_name, monthly_dues_amount, due_day, opening_balance, opening_balance_date,
         internship_start_date, internship_end_date, setup_completed)
        values (${input.organizationName}, ${input.monthlyDuesAmount}, ${input.dueDay}, ${input.openingBalance},
                ${input.openingBalanceDate}, ${input.internshipStartDate}, ${input.internshipEndDate}, true)`;
    }

    // Seed the starting dues period.
    const dueDate = `${input.startMonth.year}-${String(input.startMonth.month).padStart(2, "0")}-${String(input.dueDay).padStart(2, "0")}`;
    await tx`insert into dues_periods (year, month, amount_per_member, due_date)
             values (${input.startMonth.year}, ${input.startMonth.month}, ${input.monthlyDuesAmount}, ${dueDate})
             on conflict (year, month) do nothing`;

    const admin = await tx`select id from admin_users order by created_at asc limit 1`;
    if (admin[0]) {
      // Reuse the existing treasurer row so a re-run never triggers a duplicate
      // username error; the row simply adopts the new username/password.
      await tx`update admin_users set username = ${input.username}, password_hash = ${passwordHash}, active = true, updated_at = now() where id = ${admin[0].id}`;
    } else {
      await tx`insert into admin_users (username, password_hash) values (${input.username}, ${passwordHash})`;
    }

    const viewer = await tx`select id from viewer_access order by updated_at desc limit 1`;
    if (viewer[0]) {
      await tx`update viewer_access set pin_hash = ${pinHash}, updated_at = now() where id = ${viewer[0].id}`;
    } else {
      await tx`insert into viewer_access (pin_hash) values (${pinHash})`;
    }
  });

  return { ok: true };
}
