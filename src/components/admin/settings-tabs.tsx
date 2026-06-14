"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, ShieldCheck, Scale, Download } from "lucide-react";
import { SettingsDues } from "./settings-dues";
import { ReconciliationPanel } from "./reconciliation-panel";
import { SecurityPanel } from "./security-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AppSettings } from "@/lib/types";

type Tab = "umum" | "rekonsiliasi" | "keamanan";

export function SettingsTabs({
  settings,
  username,
  activeMembers,
  systemBankBalance,
  undepositedCash,
}: {
  settings: AppSettings;
  username: string;
  activeMembers: number;
  systemBankBalance: number;
  undepositedCash: number;
}) {
  const [tab, setTab] = useState<Tab>("umum");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "umum", label: "Umum", icon: <Settings2 className="h-4 w-4" /> },
    { id: "rekonsiliasi", label: "Rekonsiliasi", icon: <Scale className="h-4 w-4" /> },
    { id: "keamanan", label: "Keamanan", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "tap relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              tab === t.id ? "text-brand-700" : "text-ink-muted hover:text-ink",
            )}
          >
            {tab === t.id && (
              <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
            <span className="relative">{t.icon}</span>
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "umum" && (
        <div className="space-y-4">
          <SettingsDues settings={settings} activeMembers={activeMembers} />
          <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-heading text-base font-bold">Cadangan data</h3>
              <p className="text-xs text-ink-muted">Unduh seluruh data (tanpa password/PIN) dalam format JSON.</p>
            </div>
            <a href="/api/backup" download>
              <Button variant="secondary">
                <Download className="h-4 w-4" /> Unduh backup JSON
              </Button>
            </a>
          </div>
        </div>
      )}

      {tab === "rekonsiliasi" && (
        <ReconciliationPanel systemBankBalance={systemBankBalance} undepositedCash={undepositedCash} />
      )}

      {tab === "keamanan" && <SecurityPanel username={username} />}
    </div>
  );
}
