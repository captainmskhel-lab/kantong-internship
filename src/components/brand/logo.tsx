import { cn } from "@/lib/cn";

/**
 * Kantong Internship logo mark — a rounded-square "pocket" with a soft fold and
 * a subtle medical cross/heartbeat accent (spec §8). Pure SVG so it works as
 * favicon, PWA icon, and PDF logo.
 */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kantong-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B91C1C" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="13" fill="url(#kantong-grad)" />
      {/* pocket flap */}
      <path d="M12 19h24l-3.2 4.4a4 4 0 0 1-3.24 1.66H18.44a4 4 0 0 1-3.24-1.66L12 19Z" fill="#fff" fillOpacity="0.92" />
      {/* heartbeat line + cross accent */}
      <path
        d="M14 31h5l1.8-3.4 2.6 6.2 2.3-4.2 1.4 1.4H34"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoLockup({
  className,
  subtitle = true,
  size = 40,
}: {
  className?: string;
  subtitle?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <div className="leading-tight">
        <div className="font-heading text-lg font-extrabold tracking-tight text-ink">
          Kantong <span className="text-brand-600">Internship</span>
        </div>
        {subtitle && (
          <div className="text-[11px] font-medium text-ink-muted">
            RSUD Kabanjahe • Tigapanah • Merek
          </div>
        )}
      </div>
    </div>
  );
}
