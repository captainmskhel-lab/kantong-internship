"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  Building2,
  Banknote,
  TrendingUp,
  TrendingDown,
  Plus,
  Receipt,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  ArrowUpRight,
} from "lucide-react";
import { CountUpRupiah, CountUpNumber } from "@/components/ui/count-up";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { IncomeExpenseChart } from "./mini-chart";
import { TransactionCard } from "@/components/shared/transaction-card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useAdmin } from "./shell-context";
import { rupiah } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { AdminOverview } from "@/lib/service";

export function DashboardView({ overview }: { overview: AdminOverview }) {
  const { openPayment, openExpense } = useAdmin();
  const { balances, periodSummary } = overview;
  const pct =
    periodSummary.targetTotal > 0
      ? Math.min(100, Math.round((periodSummary.collectedTotal / periodSummary.targetTotal) * 100))
      : 0;
  const net = overview.thisMonthIncome - overview.thisMonthExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">Selamat datang kembali 👋</p>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-[28px]">Dashboard</h1>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button size="sm" onClick={() => openPayment()}>
            <Plus className="h-4 w-4" /> Pembayaran
          </Button>
          <Button size="sm" variant="secondary" onClick={openExpense}>
            <Receipt className="h-4 w-4" /> Pengeluaran
          </Button>
        </div>
      </div>

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ===== Hero balance card ===== */}
        <StaggerItem className="lg:col-span-8">
          <div className="relative h-full overflow-hidden rounded-[30px] bg-hero-mesh p-6 text-white shadow-glow sm:p-8">
            {/* decorative depth */}
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-sheen opacity-20" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <Wallet className="h-3.5 w-3.5" /> Saldo kas saat ini
                </span>
                <span className="text-xs font-medium text-white/70">{overview.currentMonth.label}</span>
              </div>

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

        {/* ===== Right rail: month stats ===== */}
        <StaggerItem className="lg:col-span-4">
          <div className="grid h-full grid-cols-2 gap-4 lg:grid-cols-1">
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              tone="positive"
              label="Pemasukan bulan ini"
              value={overview.thisMonthIncome}
            />
            <StatCard
              icon={<TrendingDown className="h-4 w-4" />}
              tone="muted"
              label="Pengeluaran bulan ini"
              value={overview.thisMonthExpense}
              footer={
                <span className={cn("text-xs font-semibold", net >= 0 ? "text-positive" : "text-brand-600")}>
                  {net >= 0 ? "+" : "−"}
                  {rupiah(Math.abs(net))} bersih bulan ini
                </span>
              }
            />
          </div>
        </StaggerItem>

        {/* ===== Dues progress ===== */}
        <StaggerItem className="lg:col-span-5">
          <div className="card-interactive h-full p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-bold">Iuran {overview.currentMonth.label}</h2>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-bold text-brand-600 tnum">{pct}%</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Terkumpul <b className="text-ink tnum">{rupiah(periodSummary.collectedTotal)}</b> dari{" "}
              <span className="tnum">{rupiah(periodSummary.targetTotal)}</span>
            </p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-sand">
              <motion.div
                className="h-full rounded-full bg-brand-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <DuesCount icon={<CheckCircle2 className="h-4 w-4" />} tone="positive" label="Sudah bayar" value={periodSummary.lunas} />
              <DuesCount icon={<CircleDashed className="h-4 w-4" />} tone="warning" label="Sebagian" value={periodSummary.sebagian} />
              <DuesCount icon={<CircleSlash className="h-4 w-4" />} tone="muted" label="Belum bayar" value={periodSummary.belum} />
            </div>
          </div>
        </StaggerItem>

        {/* ===== Chart ===== */}
        <StaggerItem className="lg:col-span-7">
          <div className="card-interactive h-full p-5 sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-heading text-base font-bold">Pemasukan vs Pengeluaran</h2>
              <span className="text-xs text-ink-muted">6 bulan terakhir</span>
            </div>
            <IncomeExpenseChart data={overview.monthlyChart} />
          </div>
        </StaggerItem>

        {/* ===== Unpaid members ===== */}
        <StaggerItem className="lg:col-span-5">
          <div className="card h-full p-5 sm:p-6">
            <h2 className="mb-3 font-heading text-base font-bold">Belum lunas bulan ini</h2>
            {overview.unpaidMembers.length === 0 ? (
              <EmptyState variant="done" title="Semua anggota sudah bayar. Mantap." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {overview.unpaidMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openPayment(m.id)}
                    className="group tap inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {m.full_name}
                    <Plus className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </StaggerItem>

        {/* ===== Recent transactions ===== */}
        <StaggerItem className="lg:col-span-7">
          <div className="card h-full p-5 sm:p-6">
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

function StatCard({
  icon,
  label,
  value,
  tone,
  footer,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "positive" | "muted";
  footer?: React.ReactNode;
}) {
  return (
    <div className="card-interactive flex h-full flex-col justify-between p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl",
            tone === "positive" ? "bg-positive/10 text-positive" : "bg-sand text-ink-muted",
          )}
        >
          {icon}
        </div>
        <ArrowUpRight className="h-4 w-4 text-ink-soft" />
      </div>
      <div className="mt-3">
        <div className="text-xs font-medium text-ink-muted">{label}</div>
        <div className="mt-0.5 font-heading text-xl font-extrabold tracking-tight tnum sm:text-2xl">
          <CountUpRupiah value={value} />
        </div>
        {footer && <div className="mt-1">{footer}</div>}
      </div>
    </div>
  );
}

function DuesCount({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "positive" | "warning" | "muted";
}) {
  const tones = {
    positive: "bg-positive/10 text-positive",
    warning: "bg-warning/10 text-warning",
    muted: "bg-sand text-ink-muted",
  };
  return (
    <div className="rounded-2xl border border-line p-3 text-center transition hover:border-line-strong">
      <div className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>
      <div className="mt-2 font-heading text-2xl font-extrabold tnum">
        <CountUpNumber value={value} />
      </div>
      <div className="text-[11px] font-medium text-ink-muted">{label}</div>
    </div>
  );
}
