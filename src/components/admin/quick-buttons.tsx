"use client";

import { Plus, Receipt, Banknote } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAdmin } from "./shell-context";

export function RecordPaymentButton(props: ButtonProps) {
  const { openPayment } = useAdmin();
  return (
    <Button onClick={() => openPayment()} {...props}>
      <Plus className="h-4 w-4" /> Catat Pembayaran
    </Button>
  );
}

export function RecordExpenseButton(props: ButtonProps) {
  const { openExpense } = useAdmin();
  return (
    <Button variant="secondary" onClick={openExpense} {...props}>
      <Receipt className="h-4 w-4" /> Catat Pengeluaran
    </Button>
  );
}

export function RecordIncomeButton(props: ButtonProps) {
  const { openIncome } = useAdmin();
  return (
    <Button variant="secondary" onClick={openIncome} {...props}>
      <Banknote className="h-4 w-4" /> Pemasukan Lain
    </Button>
  );
}
