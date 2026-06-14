"use client";

import { ArrowDownLeft, ArrowUpRight, Banknote, ArrowLeftRight, Paperclip } from "lucide-react";
import { rupiah } from "@/lib/money";
import { formatDateShortID } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Pill } from "@/components/ui/badge";
import type { TransactionType, PaymentMethod } from "@/lib/types";

export interface DisplayTransaction {
  id: string;
  transaction_code: string;
  transaction_type: TransactionType;
  title: string;
  member_name: string | null;
  category_name: string | null;
  amount: number;
  transaction_date: string;
  payment_method: PaymentMethod;
  proof_url: string | null;
  status?: "active" | "cancelled";
  cash_deposit_status?: "not_applicable" | "undeposited" | "deposited";
}

export function TransactionCard({
  tx,
  onClick,
  highlight,
}: {
  tx: DisplayTransaction;
  onClick?: () => void;
  highlight?: boolean;
}) {
  const isExpense = tx.transaction_type === "expense";
  const cancelled = tx.status === "cancelled";

  return (
    <button
      onClick={onClick}
      className={cn(
        "tap group flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-px hover:border-brand-200 hover:shadow-card",
        highlight && "ring-2 ring-brand-200",
        cancelled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isExpense ? "bg-stone-100 text-ink-muted" : "bg-positive/10 text-positive",
        )}
      >
        {isExpense ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-semibold text-ink", cancelled && "line-through")}>
            {tx.title}
          </span>
          {tx.proof_url && <Paperclip className="h-3.5 w-3.5 shrink-0 text-ink-muted" />}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
          <span>{formatDateShortID(tx.transaction_date)}</span>
          <span className="inline-flex items-center gap-1">
            {tx.payment_method === "cash" ? <Banknote className="h-3 w-3" /> : <ArrowLeftRight className="h-3 w-3" />}
            {tx.payment_method === "cash" ? "Cash" : "Transfer"}
          </span>
          {(tx.member_name || tx.category_name) && <span>• {tx.member_name ?? tx.category_name}</span>}
          {cancelled && <Pill tone="warning">Dibatalkan</Pill>}
          {tx.cash_deposit_status === "undeposited" && <Pill tone="warning">Belum disetor</Pill>}
        </span>
      </span>

      <span className={cn("shrink-0 font-heading text-sm font-bold tnum", isExpense ? "text-ink" : "text-positive")}>
        {isExpense ? "−" : "+"}
        {rupiah(tx.amount)}
      </span>
    </button>
  );
}
