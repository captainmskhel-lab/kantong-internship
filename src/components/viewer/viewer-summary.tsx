"use client";

import { motion } from "framer-motion";
import { Wallet, Building2, Banknote, TrendingUp, TrendingDown, CheckCircle2, CircleDashed, CircleSlash } from "lucide-react";
import { CountUpRupiah } from "@/components/ui/count-up";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { TransactionCard } from "@/components/shared/transaction-card";
import { EmptyState } from "@/components/ui/states";
import { rupiah } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { ViewerOverview } from "@/lib/service";

export function ViewerSummary({ overview }: { overview: ViewerOverview }) {
  const { balances, periodSummary } = overview;
  const pct =
    periodSummary.targetTotal > 0
      ? Math.min(100, Math.round((periodSummary.collectedTotal / periodSummary.targetTotal) * 100))
      : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Ringkasan kas</h1>
        <p className="text-sm text-ink-muted">{overview.organizationSubtitle}</p>
      </div>

      <Stagger className="space-y-4">
        <StaggerItem>
          <div className="relative overflow-hidden rounded-[30px] bg-hero-mesh p-6 text-white shadow-glow sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-sheen opacity-20" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Wallet className="h-3.5 w-3.5" /> Saldo kas saat ini
              </span>
              <div className="mt-4 font-heading text-4xl font-extrabold leading-none tracking-tight tnum sm:text-5xl lg:text-[3.4rem]">
                <CountUpRupiah value={balances.totalCash} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg">
                <div className="rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-inset ring-white/10 backdrop-blur">
                  <div className="flex items-center gap-1.5 text-xs text-white/75">
                    <Building2 className="h-3.5 w-3.5" /> Saldo di rekening
                  </div>
                  <div className="mt-0.5 font-heading text-lg font-bold tnum">{rupiah(balances.bankBalance)}</div>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-inset ring-white/10 backdrop-blur">
                  <div className="flex items-center gap-1.5 text-xs text-white/75">
                    <Banknote className="h-3.5 w-3.5" /> Cash belum disetor
                  </div>
                  <div className="mt-0.5 font-heading text-lg font-bold tnum">{rupiah(balances.undepositedCash)}</div>
                </div>
              </div>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Stat icon={<TrendingUp className="h-4 w-4" />} tone="positive" label="Pemasukan bulan ini" value={overview.thisMonthIncome} />
            <Stat icon={<TrendingDown className="h-4 w-4" />} tone="muted" label="Pengeluaran bulan ini" value={overview.thisMonthExpense} />
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-bold">Iuran {overview.currentMonth.label}</h2>
              <span className="text-sm font-semibold text-brand-600 tnum">{pct}%</span>
            </div>
            <p className="mt-0.5 text-sm text-ink-muted">
              Terkumpul <b className="text-ink tnum">{rupiah(periodSummary.collectedTotal)}</b> dari{" "}
              <span className="tnum">{rupiah(periodSummary.targetTotal)}</span>
            </p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-stone-100">
              <motion.div className="h-full rounded-full bg-brand-gradient" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Count icon={<CheckCircle2 className="h-4 w-4" />} tone="positive" label="Sudah bayar" value={periodSummary.lunas} />
              <Count icon={<CircleDashed className="h-4 w-4" />} tone="warning" label="Sebagian" value={periodSummary.sebagian} />
              <Count icon={<CircleSlash className="h-4 w-4" />} tone="muted" label="Belum bayar" value={periodSummary.belum} />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="card p-5">
            <h2 className="mb-3 font-heading text-base font-bold">Transaksi terbaru</h2>
            {overview.recentTransactions.length === 0 ? (
              <EmptyState title="Belum ada transaksi di periode ini." />
            ) : (
              <div className="space-y-2">
                {overview.recentTransactions.map((tx) => (
                  <TransactionCard key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </div>
        </StaggerItem>
      </Stagger>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "positive" | "muted" }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl", tone === "positive" ? "bg-positive/10 text-positive" : "bg-stone-100 text-ink-muted")}>
        {icon}
      </div>
      <div className="mt-3 text-xs font-medium text-ink-muted">{label}</div>
      <div className="mt-0.5 font-heading text-xl font-extrabold tracking-tight tnum sm:text-2xl">
        <CountUpRupiah value={value} />
      </div>
    </div>
  );
}

function Count({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "positive" | "warning" | "muted" }) {
  const tones = { positive: "bg-positive/10 text-positive", warning: "bg-warning/10 text-warning", muted: "bg-stone-100 text-ink-muted" };
  return (
    <div className="rounded-2xl border border-line p-3 text-center">
      <div className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>
      <div className="mt-2 font-heading text-2xl font-extrabold tnum">{value}</div>
      <div className="text-[11px] font-medium text-ink-muted">{label}</div>
    </div>
  );
}
