"use client";

import { motion } from "framer-motion";
import { Inbox, FileQuestion, PartyPopper, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** Branded full-page loader (spec §35). */
export function PageLoader({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="relative h-10 w-48 overflow-hidden rounded-full bg-stone-100">
        <motion.div
          className="loader-bar absolute inset-y-0 w-1/3"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        />
      </div>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
    </div>
  );
}

const ICONS = {
  empty: Inbox,
  proof: FileQuestion,
  done: PartyPopper,
  error: AlertTriangle,
};

export function EmptyState({
  variant = "empty",
  title,
  description,
  action,
}: {
  variant?: keyof typeof ICONS;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const Icon = ICONS[variant];
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-line bg-gradient-to-b from-white to-canvas/40 px-6 py-12 text-center">
      <div className="relative mb-4">
        {/* soft halo behind the icon */}
        <span
          className={cn(
            "absolute inset-0 -z-0 rounded-2xl blur-xl",
            variant === "done" ? "bg-positive/20" : "bg-brand-200/40",
          )}
        />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset",
            variant === "done"
              ? "bg-positive/10 text-positive ring-positive/20"
              : "bg-brand-50 text-brand-600 ring-brand-100",
          )}
        >
          <Icon className="h-7 w-7" />
        </motion.div>
      </div>
      <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
