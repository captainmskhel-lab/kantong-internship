"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  X,
  Clock,
  CornerDownLeft,
  Users,
  Wallet,
  Receipt,
  ArrowLeftRight,
  FileText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { rupiah } from "@/lib/money";
import { apiFetch } from "@/lib/client";
import { Pill } from "@/components/ui/badge";
import type { SearchGroupKey, SearchHit, SearchResponse } from "@/lib/search";

const RECENT_KEY = "kantong:recent-search";
const MAX_RECENT = 6;

const GROUP_ICON: Record<SearchGroupKey, React.ComponentType<{ className?: string }>> = {
  anggota: Users,
  pembayaran: Wallet,
  pengeluaran: Receipt,
  transaksi: ArrowLeftRight,
  laporan: FileText,
};

type FilterKey = "semua" | SearchGroupKey;

const ADMIN_FILTERS: { key: FilterKey; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "anggota", label: "Anggota" },
  { key: "pembayaran", label: "Pembayaran" },
  { key: "pengeluaran", label: "Pengeluaran" },
  { key: "laporan", label: "Laporan" },
];

const VIEWER_FILTERS: { key: FilterKey; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "anggota", label: "Anggota" },
  { key: "pembayaran", label: "Pembayaran" },
  { key: "transaksi", label: "Transaksi" },
];

export function GlobalSearch({ scope }: { scope: "admin" | "viewer" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("semua");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filters = scope === "admin" ? ADMIN_FILTERS : VIEWER_FILTERS;

  // --- recent searches ---
  const loadRecent = useCallback(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      setRecent(raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : []);
    } catch {
      setRecent([]);
    }
  }, []);

  function saveRecent(term: string) {
    const t = term.trim();
    if (!t) return;
    try {
      const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {
      /* ignore */
    }
  }

  function clearRecent() {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
    setRecent([]);
  }

  // --- open / close ---
  const openPalette = useCallback(() => {
    setOpen(true);
    loadRecent();
  }, [loadRecent]);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setFilter("semua");
    setActiveIndex(0);
  }, []);

  // Cmd/Ctrl+K global shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) loadRecent();
          return !o;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadRecent]);

  // Lock scroll + focus input while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [open]);

  // --- debounced search ---
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(async () => {
      const res = await apiFetch<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(res.ok && res.data ? res.data : { query: q, groups: [], total: 0 });
      setLoading(false);
      setActiveIndex(0);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const visibleGroups = useMemo(() => {
    if (!results) return [];
    if (filter === "semua") return results.groups;
    return results.groups.filter((g) => g.key === filter);
  }, [results, filter]);

  const flatItems = useMemo(() => visibleGroups.flatMap((g) => g.items), [visibleGroups]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, flatItems.length - 1)));
  }, [flatItems.length]);

  function go(hit: SearchHit) {
    saveRecent(query);
    closePalette();
    router.push(hit.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[activeIndex]) go(flatItems[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    }
  }

  // keep the active item scrolled into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const placeholder = scope === "admin" ? "Cari anggota, transaksi, laporan…" : "Cari anggota & transaksi…";

  return (
    <>
      {/* ===== Trigger ===== */}
      {/* desktop: search-styled button */}
      <button
        onClick={openPalette}
        className="hidden h-10 w-full max-w-sm items-center gap-2 rounded-2xl border border-line bg-white/70 px-3.5 text-sm text-ink-muted transition hover:border-brand-200 hover:bg-white md:flex"
        aria-label="Buka pencarian"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Cari apa saja…</span>
        <kbd className="rounded-md border border-line bg-canvas px-1.5 py-0.5 font-sans text-[11px] font-semibold text-ink-muted">
          Ctrl K
        </kbd>
      </button>
      {/* mobile: icon button */}
      <button
        onClick={openPalette}
        className="tap flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition hover:bg-sand hover:text-ink md:hidden"
        aria-label="Buka pencarian"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* ===== Palette ===== */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80] flex items-stretch justify-center sm:items-start sm:pt-[8vh]">
            <motion.div
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePalette}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Pencarian"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-glow sm:h-auto sm:max-h-[80vh] sm:w-full sm:max-w-xl sm:rounded-3xl"
            >
              {/* input */}
              <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
                <Search className="h-5 w-5 shrink-0 text-ink-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted/60"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  onClick={closePalette}
                  className="tap -mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-sand hover:text-ink"
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* filters */}
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-line px-4 py-2.5 sm:px-5">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition",
                      filter === f.key ? "bg-brand-600 text-white" : "bg-sand text-ink-muted hover:text-ink",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* body */}
              <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-2 sm:px-3">
                {loading ? (
                  <SearchSkeleton />
                ) : !query.trim() ? (
                  <RecentSearches recent={recent} onPick={setQuery} onClear={clearRecent} />
                ) : flatItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-ink-muted">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-ink">Tidak ada hasil yang cocok.</p>
                    <p className="mt-1 text-xs text-ink-muted">Coba kata kunci lain seperti nama anggota atau kode transaksi.</p>
                  </div>
                ) : (
                  <Results groups={visibleGroups} activeIndex={activeIndex} onGo={go} startIndexMap={buildIndexMap(visibleGroups)} />
                )}
              </div>

              {/* footer hint (desktop) */}
              <div className="hidden items-center justify-between border-t border-line px-5 py-2.5 text-[11px] text-ink-muted sm:flex">
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd> pindah
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Kbd>
                      <CornerDownLeft className="h-3 w-3" />
                    </Kbd>{" "}
                    buka
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Kbd>Esc</Kbd> tutup
                  </span>
                </span>
                <span>Tekan Enter untuk membuka</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Map each visible group's first flat index, so items get a global keyboard index. */
function buildIndexMap(groups: SearchResponse["groups"]): number[] {
  const starts: number[] = [];
  let n = 0;
  for (const g of groups) {
    starts.push(n);
    n += g.items.length;
  }
  return starts;
}

function Results({
  groups,
  activeIndex,
  onGo,
  startIndexMap,
}: {
  groups: SearchResponse["groups"];
  activeIndex: number;
  onGo: (hit: SearchHit) => void;
  startIndexMap: number[];
}) {
  return (
    <div className="space-y-3 py-1">
      {groups.map((group, gi) => {
        const Icon = GROUP_ICON[group.key];
        return (
          <div key={group.key}>
            <div className="flex items-center gap-1.5 px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              <Icon className="h-3.5 w-3.5" /> {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item, ii) => {
                const idx = startIndexMap[gi] + ii;
                const active = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    onClick={() => onGo(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                      active ? "bg-brand-50 ring-1 ring-inset ring-brand-100" : "hover:bg-sand",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-semibold text-ink">{item.title}</span>
                        {item.code && (
                          <span className="rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">{item.code}</span>
                        )}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
                        {item.subtitle && <span>{item.subtitle}</span>}
                        {item.meta.map((m, k) => (
                          <Pill key={k} tone="neutral">
                            {m}
                          </Pill>
                        ))}
                      </span>
                    </span>
                    {item.amount != null && (
                      <span className="shrink-0 font-heading text-sm font-bold tnum text-ink">{rupiah(item.amount)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentSearches({ recent, onPick, onClear }: { recent: string[]; onPick: (q: string) => void; onClear: () => void }) {
  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Search className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-ink">Cari apa saja…</p>
        <p className="mt-1 text-xs text-ink-muted">Nama anggota, kode transaksi, kategori, atau nominal.</p>
      </div>
    );
  }
  return (
    <div className="py-1">
      <div className="flex items-center justify-between px-3 pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Pencarian terakhir</span>
        <button onClick={onClear} className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-brand-600">
          <Trash2 className="h-3 w-3" /> Bersihkan riwayat
        </button>
      </div>
      <div className="space-y-0.5">
        {recent.map((term) => (
          <button
            key={term}
            onClick={() => onPick(term)}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-sand"
          >
            <Clock className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="truncate">{term}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-1.5 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="skeleton h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-2.5 w-1/4 rounded" />
          </div>
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-line bg-canvas px-1 font-sans text-[10px] font-semibold text-ink-muted">
      {children}
    </kbd>
  );
}
