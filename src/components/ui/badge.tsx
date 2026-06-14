import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DuesStatus } from "@/lib/types";

const STATUS_STYLES: Record<DuesStatus, string> = {
  lunas: "bg-positive/10 text-positive border-positive/20",
  sebagian: "bg-warning/10 text-warning border-warning/20",
  belum: "bg-stone-100 text-ink-muted border-line",
};

const STATUS_LABELS: Record<DuesStatus, string> = {
  lunas: "Lunas",
  sebagian: "Sebagian",
  belum: "Belum bayar",
};

export function StatusBadge({
  status,
  notStarted,
  className,
}: {
  status: DuesStatus;
  notStarted?: boolean;
  className?: string;
}) {
  if (notStarted) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-dashed border-line px-2 py-0.5 text-xs text-ink-muted/60",
          className,
        )}
        aria-label="Belum mulai"
      >
        <Minus className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status === "lunas" && <Check className="h-3 w-3" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "positive" | "warning";
  className?: string;
}) {
  const tones = {
    neutral: "bg-stone-100 text-ink-muted",
    brand: "bg-brand-50 text-brand-700",
    positive: "bg-positive/10 text-positive",
    warning: "bg-warning/10 text-warning",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
