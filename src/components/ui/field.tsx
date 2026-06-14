"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  children,
  required,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label className="label-base">
          {label}
          {required && <span className="text-brand-600"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && <p className="text-xs font-medium text-brand-600">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn("input-base tnum", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn("input-base min-h-[90px] resize-y", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn("input-base appearance-none bg-white pr-10", className)} {...props}>
        {children}
      </select>
    );
  },
);

/** Transfer / Cash style segmented control (spec §17, §22). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("grid auto-cols-fr grid-flow-col gap-2", className)} role="radiogroup">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-labelledby={`${id}-${opt.value}`}
            onClick={() => onChange(opt.value)}
            className={cn(
              "tap flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
              active
                ? "border-brand-300 bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.2)]"
                : "border-line bg-white text-ink-muted hover:border-brand-200",
            )}
          >
            {opt.icon}
            <span id={`${id}-${opt.value}`}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Accessible toggle switch for visibility controls (spec §24). */
export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="tap flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left transition hover:border-brand-200"
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-muted">{description}</span>}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
          checked ? "bg-brand-600" : "bg-stone-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
