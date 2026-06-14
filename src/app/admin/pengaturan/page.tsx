import { requireAdminPage } from "@/lib/guard";
import { getSettings, getMembers, getTransactions } from "@/lib/repo";
import { computeBalances } from "@/lib/finance";
import { SettingsTabs } from "@/components/admin/settings-tabs";
import { PageTransition } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/states";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdminPage();
  const [settings, members, transactions] = await Promise.all([getSettings(), getMembers(), getTransactions()]);
  if (!settings) return <EmptyState variant="error" title="Pengaturan belum siap" />;
  const balances = computeBalances(settings.opening_balance, transactions);
  const activeMembers = members.filter((m) => m.active).length;

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-ink-muted">Kelola iuran, saldo, rekonsiliasi, dan keamanan.</p>
        </div>
        <SettingsTabs
          settings={settings}
          username={admin.username}
          activeMembers={activeMembers}
          systemBankBalance={balances.bankBalance}
          undepositedCash={balances.undepositedCash}
        />
      </div>
    </PageTransition>
  );
}
