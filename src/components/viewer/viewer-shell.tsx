"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, ClipboardList, ArrowLeftRight, LogOut, Eye } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/client";
import { GlobalSearch } from "@/components/search/global-search";

// Reports are admin-only: members can view summary, transactions, dues status
// and allowed proofs, but cannot generate or download reports.
const NAV = [
  { href: "/lihat", label: "Ringkasan", icon: LayoutGrid },
  { href: "/lihat/iuran", label: "Status Iuran", icon: ClipboardList },
  { href: "/lihat/transaksi", label: "Transaksi", icon: ArrowLeftRight },
];

export function ViewerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => (href === "/lihat" ? pathname === "/lihat" : pathname.startsWith(href));

  async function logout() {
    await apiFetch("/api/viewer/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/lihat" className="flex shrink-0 items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-heading text-sm font-extrabold tracking-tight">
              Kantong <span className="text-brand-600">Internship</span>
            </span>
          </Link>
          <div className="flex flex-1 items-center justify-end gap-2">
            <GlobalSearch scope="viewer" />
            <button
              onClick={logout}
              className="tap inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-600"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mode banner (visible but not distracting) */}
        <div className="bg-brand-50/70">
          <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-1.5 text-xs font-medium text-brand-700 sm:px-6">
            <Eye className="h-3.5 w-3.5" /> Mode anggota — hanya bisa melihat
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="mx-auto hidden max-w-4xl gap-1 px-4 pb-2 sm:flex sm:px-6">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                  active ? "text-brand-700" : "text-ink-muted hover:text-ink",
                )}
              >
                {active && (
                  <motion.span layoutId="viewer-nav" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <item.icon className="relative h-4 w-4" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-28 pt-5 sm:px-6 sm:pb-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="tap relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold">
                {active && (
                  <motion.span layoutId="viewer-bottom" className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-600" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <item.icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-ink-muted")} />
                <span className={active ? "text-brand-600" : "text-ink-muted"}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
