import { requireAdminPage } from "@/lib/guard";
import { getSettings, getMembers, getCategories } from "@/lib/repo";
import { currentYearMonthJakarta, monthLabelID, monthsBetween, toYearMonth } from "@/lib/dates";
import { AdminShell } from "@/components/admin/admin-shell";
import type { AdminContextData } from "@/components/admin/shell-context";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const [settings, members, incomeCategories, expenseCategories] = await Promise.all([
    getSettings(),
    getMembers(),
    getCategories("income"),
    getCategories("expense"),
  ]);

  if (!settings) {
    // Should not happen post-setup, but fail safe.
    return <div className="p-8 text-center text-ink-muted">Pengaturan belum siap. Jalankan setup lebih dulu.</div>;
  }

  const now = currentYearMonthJakarta();
  // Month options: from internship start month (or 6 months back) to current + 1.
  // Use the safe parser — the DB value may be a Date object, not a string.
  let start: { year: number; month: number };
  const parsedStart = toYearMonth(settings.internship_start_date);
  if (parsedStart) {
    start = parsedStart;
  } else {
    let y = now.year;
    let m = now.month - 6;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    start = { year: y, month: m };
  }
  let endY = now.year;
  let endM = now.month + 1;
  if (endM > 12) {
    endM = 1;
    endY += 1;
  }
  const monthOptions = monthsBetween(start, { year: endY, month: endM })
    .map((p) => ({ ...p, label: monthLabelID(p.year, p.month) }))
    .reverse();

  const data: AdminContextData = {
    username: admin.username,
    settings,
    members,
    incomeCategories,
    expenseCategories,
    monthOptions,
    currentMonth: now,
  };

  return <AdminShell data={data}>{children}</AdminShell>;
}
