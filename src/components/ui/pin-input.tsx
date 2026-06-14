"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Six-box numeric PIN input (spec §12). Accessible (single hidden field semantics
 * via aria-label), supports paste, backspace navigation, auto-advance, mobile
 * numeric keyboard, and auto-submit when complete.
 */
export function PinInput({
  length = 6,
  onComplete,
  onChange,
  disabled,
  error,
}: {
  length?: number;
  onComplete?: (pin: string) => void;
  onChange?: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function update(next: string[]) {
    setValues(next);
    const joined = next.join("");
    onChange?.(joined);
    if (joined.length === length && next.every((v) => v !== "")) {
      onComplete?.(joined);
    }
  }

  function handleChange(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[idx] = digit;
    update(next);
    if (digit && idx < length - 1) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (values[idx]) {
        const next = [...values];
        next[idx] = "";
        update(next);
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
        const next = [...values];
        next[idx - 1] = "";
        update(next);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    update(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Masukkan PIN anggota 6 digit">
      {values.map((value, idx) => (
        <motion.input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${idx + 1}`}
          whileFocus={{ scale: 1.04 }}
          className={cn(
            "h-14 w-12 rounded-2xl border bg-white text-center font-heading text-2xl font-bold text-ink outline-none transition tnum sm:h-16 sm:w-14",
            error
              ? "border-brand-300 ring-4 ring-brand-100"
              : value
                ? "border-brand-300 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.25)]"
                : "border-line focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
          )}
        />
      ))}
    </div>
  );
}
