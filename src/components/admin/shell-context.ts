"use client";

import { createContext, useContext } from "react";
import type { AppSettings, Category, Member } from "@/lib/types";

export interface AdminContextData {
  username: string;
  settings: AppSettings;
  members: Member[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  monthOptions: { year: number; month: number; label: string }[];
  currentMonth: { year: number; month: number };
}

export interface AdminForms {
  data: AdminContextData;
  openPayment: (memberId?: string) => void;
  openExpense: () => void;
  openIncome: () => void;
}

export const AdminFormsContext = createContext<AdminForms | null>(null);

export function useAdmin(): AdminForms {
  const ctx = useContext(AdminFormsContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminShell");
  return ctx;
}
