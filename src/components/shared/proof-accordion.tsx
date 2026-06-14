"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, FileText, ImageOff } from "lucide-react";
import { buildProofView } from "@/lib/drive";
import { rupiah } from "@/lib/money";
import { formatDateID } from "@/lib/dates";

export function ProofAccordion({
  proofUrl,
  amount,
  date,
  method,
}: {
  proofUrl: string;
  amount?: number;
  date?: string;
  method?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const view = buildProofView(proofUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        className="tap flex w-full items-center justify-between gap-2 bg-brand-50/50 px-4 py-2.5 text-sm font-semibold text-brand-700"
      >
        <span className="inline-flex items-center gap-2">
          <FileText className="h-4 w-4" /> Lihat bukti pembayaran
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-3 p-4">
              {(amount != null || date || method) && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
                  {amount != null && (
                    <span>
                      Nominal: <b className="text-ink tnum">{rupiah(amount)}</b>
                    </span>
                  )}
                  {date && (
                    <span>
                      Tanggal: <b className="text-ink">{formatDateID(date)}</b>
                    </span>
                  )}
                  {method && (
                    <span>
                      Cara: <b className="capitalize text-ink">{method}</b>
                    </span>
                  )}
                </div>
              )}

              {view?.canEmbed && !failed ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-line bg-canvas">
                  <iframe
                    src={view.previewUrl ?? undefined}
                    className="h-full w-full"
                    allow="autoplay"
                    onError={() => setFailed(true)}
                    title="Pratinjau bukti"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-muted">
                  <ImageOff className="h-4 w-4" />
                  Bukti tidak bisa ditampilkan di sini. Coba buka lewat Google Drive.
                </div>
              )}

              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tap inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white"
              >
                <ExternalLink className="h-4 w-4" /> Buka bukti di Google Drive
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
