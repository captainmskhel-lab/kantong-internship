"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Users,
  ArrowLeftRight,
  FileText,
  Settings,
  Plus,
  LogOut,
  Banknote,
  TrendingUp,
  X,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/client";
import { monthLabelID } from "@/lib/dates";
import { AdminFormsContext, type AdminContextData } from "./shell-context";
import { PaymentForm } from "./payment-form";
import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "./income-form";
import { GlobalSearch } from "@/components/search/global-search";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pembayaran", label: "Pembayaran", icon: Wallet },
  { href: "/admin/pengeluaran", label: "Pengeluaran", icon: Receipt },
  { href: "/admin/anggota", label: "Anggota", icon: Users },
  { href: "/admin/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/admin/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

// Bottom nav shows the 5 most-used; the rest live in the drawer.
const BOTTOM_NAV = NAV.filter((n) =>
  ["/admin", "/admin/pembayaran", "/admin/anggota", "/admin/transaksi", "/admin/laporan"].includes(n.href),
);

const STORAGE_KEY = "kantong:sidebar-collapsed";

export function AdminShell({ data, children }: { data: AdminContextData; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState<null | "payment" | "expense" | "income">(null);
  const [paymentMember, setPaymentMember] = useState<string | undefined>(undefined);
  const [fabOpen, setFabOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Restore sidebar preference from localStorage.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function openPayment(memberId?: string) {
    setPaymentMember(memberId);
    setSheet("payment");
    setFabOpen(false);
    setDrawerOpen(false);
  }
  function openExpense() {
    setSheet("expense");
    setFabOpen(false);
    setDrawerOpen(false);
  }
  function openIncome() {
    setSheet("income");
    setFabOpen(false);
    setDrawerOpen(false);
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <AdminFormsContext.Provider value={{ data, openPayment, openExpense, openIncome }}>
      <div className="min-h-dvh">
        {/* ===== Desktop sidebar ===== */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-white/85 backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
            collapsed ? "w-[80px] px-2.5 py-5" : "w-64 px-4 py-5",
          )}
        >
          {/* header: logo + collapse toggle */}
          <div className={cn("mb-6 flex items-center", collapsed ? "flex-col gap-3" : "justify-between px-1")}>
            <Link href="/admin" className="flex items-center gap-2.5" aria-label="Kantong Internship">
              <LogoMark size={collapsed ? 36 : 34} />
              {!collapsed && (
                <span className="font-heading text-base font-extrabold tracking-tight">
                  Kantong <span className="text-brand-600">Internship</span>
                </span>
              )}
            </Link>
            <button
              onClick={toggleCollapsed}
              className="tap flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted transition hover:bg-sand hover:text-ink"
              aria-label={collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
              title={collapsed ? "Lebarkan" : "Ciutkan"}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-2xl text-sm font-semibold transition-colors",
                    collapsed ? "h-11 w-11 justify-center self-center" : "gap-3 px-3 py-2.5",
                    active ? "text-brand-700" : "text-ink-muted hover:bg-sand hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-pill"
                      className="absolute inset-0 rounded-2xl bg-brand-50 ring-1 ring-inset ring-brand-100"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <item.icon className="relative h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="relative">{item.label}</span>}
                  {collapsed && <span className="nav-tip group-hover:opacity-100">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className={cn("space-y-2 border-t border-line pt-3", collapsed && "flex flex-col items-center")}>
            {collapsed ? (
              <>
                <button
                  onClick={() => openPayment()}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-card"
                  aria-label="Catat Pembayaran"
                >
                  <Plus className="h-5 w-5" />
                  <span className="nav-tip group-hover:opacity-100">Catat Pembayaran</span>
                </button>
                <button
                  onClick={openExpense}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-line text-ink-muted transition hover:border-brand-200 hover:text-brand-600"
                  aria-label="Catat Pengeluaran"
                >
                  <Receipt className="h-5 w-5" />
                  <span className="nav-tip group-hover:opacity-100">Catat Pengeluaran</span>
                </button>
                <button
                  onClick={logout}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-2xl text-ink-muted transition hover:bg-sand hover:text-brand-600"
                  aria-label="Keluar"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="nav-tip group-hover:opacity-100">Keluar</span>
                </button>
              </>
            ) : (
              <>
                <Button onClick={() => openPayment()} fullWidth size="sm">
                  <Plus className="h-4 w-4" /> Catat Pembayaran
                </Button>
                <Button onClick={openExpense} variant="secondary" fullWidth size="sm">
                  <Receipt className="h-4 w-4" /> Catat Pengeluaran
                </Button>
                <button
                  onClick={logout}
                  className="tap mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-sand hover:text-brand-600"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </>
            )}
          </div>
        </aside>

        {/* ===== Main column ===== */}
        <div className={cn("transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", collapsed ? "lg:pl-[80px]" : "lg:pl-64")}>
          {/* top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="tap flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition hover:bg-sand hover:text-ink lg:hidden"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2.5 lg:hidden">
                <LogoMark size={30} />
                <span className="font-heading text-sm font-extrabold">Kantong Internship</span>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 xl:inline-flex">
                <TrendingUp className="h-3.5 w-3.5" /> {monthLabelID(data.currentMonth.year, data.currentMonth.month)}
              </span>
            </div>

            {/* Global search — fills the centre on desktop */}
            <div className="flex flex-1 justify-end md:justify-center">
              <GlobalSearch scope="admin" />
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-ink-muted lg:inline">
                Halo, <b className="text-ink">{data.username}</b>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                {data.username.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 2xl:max-w-[1500px]">
            {children}
          </main>
        </div>

        {/* ===== Mobile drawer (full nav) ===== */}
        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="absolute inset-y-0 left-0 flex w-[78%] max-w-xs flex-col bg-white px-4 py-5 shadow-glow"
              >
                <div className="mb-6 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <LogoMark size={32} />
                    <span className="font-heading text-base font-extrabold tracking-tight">
                      Kantong <span className="text-brand-600">Internship</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="tap flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-sand"
                    aria-label="Tutup menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-1">
                  {NAV.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                          active ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100" : "text-ink-muted hover:bg-sand hover:text-ink",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="space-y-2 border-t border-line pt-3">
                  <Button onClick={() => openPayment()} fullWidth size="sm">
                    <Plus className="h-4 w-4" /> Catat Pembayaran
                  </Button>
                  <button
                    onClick={logout}
                    className="tap flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-sand hover:text-brand-600"
                  >
                    <LogOut className="h-4 w-4" /> Keluar
                  </button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* ===== Mobile bottom nav ===== */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-md items-stretch justify-around">
            {BOTTOM_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="tap relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="admin-bottom-pill"
                      className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-600"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-ink-muted")} />
                  <span className={active ? "text-brand-600" : "text-ink-muted"}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ===== Mobile FAB ===== */}
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 lg:hidden">
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="flex flex-col items-end gap-2"
              >
                <FabAction label="Catat Pembayaran" icon={<Wallet className="h-4 w-4" />} onClick={() => openPayment()} />
                <FabAction label="Catat Pengeluaran" icon={<Receipt className="h-4 w-4" />} onClick={openExpense} />
                <FabAction label="Pemasukan lain" icon={<Banknote className="h-4 w-4" />} onClick={openIncome} />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setFabOpen((o) => !o)}
            className="tap flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow"
            aria-label="Aksi cepat"
          >
            <motion.span animate={{ rotate: fabOpen ? 45 : 0 }}>
              {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </motion.span>
          </motion.button>
        </div>

        {/* ===== Form sheets ===== */}
        <Sheet open={sheet === "payment"} onClose={() => setSheet(null)} title="Catat Pembayaran" description="Catat iuran anggota dengan cepat.">
          <PaymentForm data={data} initialMemberId={paymentMember} onDone={() => setSheet(null)} />
        </Sheet>
        <Sheet open={sheet === "expense"} onClose={() => setSheet(null)} title="Catat Pengeluaran">
          <ExpenseForm data={data} onDone={() => setSheet(null)} />
        </Sheet>
        <Sheet open={sheet === "income"} onClose={() => setSheet(null)} title="Catat Pemasukan Lain">
          <IncomeForm data={data} onDone={() => setSheet(null)} />
        </Sheet>
      </div>
    </AdminFormsContext.Provider>
  );
}

function FabAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-card"
    >
      <span className="text-brand-600">{icon}</span>
      {label}
    </button>
  );
}
