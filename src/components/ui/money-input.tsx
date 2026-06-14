"use client";

import { useState, useEffect } from "react";
import { formatNumberID, parseRupiah } from "@/lib/money";
import { cn } from "@/lib/cn";

/**
 * Rupiah input that formats with thousands separators as the user types and
 * reports an integer value (or null). Money is never held as a float.
 */
export function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  autoFocus,
  id,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
}) {
  const [text, setText] = useState(value != null ? formatNumberID(value) : "");

  useEffect(() => {
    // Keep in sync when the value is set externally (e.g. default dues amount).
    const parsedText = parseRupiah(text);
    if (value !== parsedText) {
      setText(value != null ? formatNumberID(value) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const parsed = parseRupiah(raw);
    if (raw.trim() === "") {
      setText("");
      onChange(null);
      return;
    }
    if (parsed == null) return; // ignore non-numeric keystrokes
    setText(formatNumberID(parsed));
    onChange(parsed);
  }

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-ink-muted">
        Rp
      </span>
      <input
        id={id}
        inputMode="numeric"
        autoFocus={autoFocus}
        value={text}
        onChange={handle}
        placeholder={placeholder}
        className="input-base tnum pl-10 text-right font-heading text-lg font-bold"
      />
    </div>
  );
}
