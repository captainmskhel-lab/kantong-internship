"use client";

import { useContext, useState } from "react";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProofAccordion } from "@/components/shared/proof-accordion";
import { AdminFormsContext } from "./shell-context";
import { rupiah } from "@/lib/money";
import { formatDateID } from "@/lib/dates";
import { cn } from "@/lib/cn";
import type { DuesMatrixRow, DuesMatrixCell } from "@/lib/service";

interface SelectedCell {
  memberName: string;
  memberId: string;
  cell: DuesMatrixCell;
}

export function DuesMatrix({
  months,
  rows,
}: {
  months: { year: number; month: number; label: string }[];
  rows: DuesMatrixRow[];
}) {
  // Works in both admin (context present → quick-pay enabled) and viewer (no context).
  const admin = useContext(AdminFormsContext);
  const openPayment = admin?.openPayment;
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  return (
    <>
      <div className="card overflow-hidden">
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <th className="sticky left-0 z-10 bg-canvas/95 px-4 py-3 text-left font-heading text-xs font-bold uppercase tracking-wide text-ink-muted backdrop-blur">
                  Nama
                </th>
                {months.map((m) => (
                  <th key={`${m.year}-${m.month}`} className="px-3 py-3 text-center text-xs font-semibold text-ink-muted">
                    {m.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.member.id} className="border-b border-line/70 last:border-0 hover:bg-canvas/40">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white/95 px-4 py-2.5 font-medium text-ink backdrop-blur">
                    {row.member.full_name}
                  </td>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="px-2 py-2 text-center">
                      <button
                        onClick={() => setSelected({ memberName: row.member.full_name, memberId: row.member.id, cell })}
                        className="tap inline-flex"
                        aria-label={`${row.member.full_name} ${cell.monthLabel}`}
                      >
                        <StatusBadge status={cell.status} notStarted={cell.notStarted} />
                      </button>
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-heading text-sm font-bold tnum">
                    {rupiah(row.totalPaid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.memberName}` : ""}
        description={selected ? `Iuran ${selected.cell.monthLabel} ${selected.cell.year}` : ""}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-canvas p-4">
              <StatusBadge status={selected.cell.status} notStarted={selected.cell.notStarted} />
              <div className="text-right">
                <div className="text-xs text-ink-muted">Terbayar</div>
                <div className="font-heading text-lg font-bold tnum">{rupiah(selected.cell.paid)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Kewajiban" value={rupiah(selected.cell.obligation)} />
              <Info label="Sisa" value={rupiah(selected.cell.remaining)} />
            </div>

            {selected.cell.payments.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-ink">Riwayat pembayaran</h3>
                {selected.cell.payments.map((p, i) => (
                  <div key={i} className="space-y-2 rounded-2xl border border-line p-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-stone-100 px-2 py-0.5 font-mono text-xs text-ink-muted">
                        {p.transaction_code}
                      </span>
                      <span className="font-heading text-sm font-bold tnum">{rupiah(p.amount)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-ink-muted">
                      <span>{formatDateID(p.transaction_date)}</span>
                      <span className="capitalize">{p.payment_method}</span>
                    </div>
                    {p.note && <p className="text-xs text-ink-muted">{p.note}</p>}
                    {p.proof_url && <ProofAccordion proofUrl={p.proof_url} amount={p.amount} date={p.transaction_date} method={p.payment_method} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-ink-muted">Belum ada pembayaran untuk bulan ini.</p>
            )}

            {openPayment && !selected.cell.notStarted && selected.cell.status !== "lunas" && (
              <Button
                fullWidth
                onClick={() => {
                  const memberId = selected.memberId;
                  setSelected(null);
                  openPayment(memberId);
                }}
              >
                <Plus className="h-4 w-4" /> Catat pembayaran
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-2xl border border-line p-3")}>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-0.5 font-heading text-base font-bold tnum">{value}</div>
    </div>
  );
}
