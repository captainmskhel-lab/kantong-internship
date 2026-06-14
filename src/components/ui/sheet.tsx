"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

/**
 * Responsive overlay: a centered modal on desktop, a bottom-sheet on mobile
 * (spec §9 "modals and drawers"). Closes on backdrop click and Escape.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-glow sm:rounded-3xl",
              size === "md" ? "sm:max-w-lg" : "sm:max-w-2xl",
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
                <div>
                  {title && <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>}
                  {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
                </div>
                <button onClick={onClose} className="tap -m-2 rounded-xl p-2 text-ink-muted transition hover:bg-stone-100 hover:text-ink" aria-label="Tutup">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {/* drag handle on mobile */}
            <div className="mx-auto my-2 h-1.5 w-10 rounded-full bg-stone-200 sm:hidden" />
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
            {footer && <div className="border-t border-line bg-canvas/60 px-5 py-3 sm:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
