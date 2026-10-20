import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { assetUrl } from "@/lib/api";

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({ className, ...props }) {
  return <label className={cn("text-[13px] font-semibold text-foreground", className)} {...props} />;
}

/** Label + control + error/hint, wired for accessibility. */
export function Field({ label, htmlFor, error, hint, children, className, action }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {(label || action) && (
        <div className="flex items-center justify-between gap-2">
          {label && <Label htmlFor={htmlFor}>{label}</Label>}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[12.5px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function Card({ className, as: As = "div", ...props }) {
  return <As className={cn("min-w-0 rounded-xl border border-border bg-card p-5 text-card-foreground", className)} {...props} />;
}

const BADGE = {
  default: "bg-accent text-accent-foreground",
  amber: "bg-warning/15 text-warning",
  blue: "bg-info/15 text-info",
  red: "bg-destructive/12 text-destructive",
  grey: "bg-muted text-muted-foreground",
  ink: "bg-primary text-primary-foreground",
};
export function Badge({ tone = "default", className, mono = false, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
        mono && "font-mono",
        BADGE[tone],
        className
      )}
      {...props}
    />
  );
}

const STATUS = {
  published: ["Published", "default"],
  paid: ["Paid", "default"],
  active: ["Active", "default"],
  approved: ["Approved", "default"],
  draft: ["Draft", "grey"],
  review: ["In review", "amber"],
  requested: ["Requested", "amber"],
  pending: ["Pending", "amber"],
  refund_requested: ["Refund requested", "blue"],
  refunded: ["Refunded", "grey"],
  rejected: ["Changes requested", "red"],
  failed: ["Failed", "red"],
  banned: ["Banned", "red"],
  unverified: ["Unverified", "amber"],
};
export function StatusPill({ status, label }) {
  const [text, tone] = STATUS[status] || [status, "grey"];
  return (
    <Badge tone={tone} mono={false} className="rounded-full px-2.5">
      {label || text}
    </Badge>
  );
}

export function Progress({ value = 0, className, barClassName, label }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-500", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const AV = ["#0f7a5c", "#2b5fb8", "#9b3a45", "#b86a12", "#6d3f8a", "#14606e"];
export function Avatar({ name = "", src, size = 32, className }) {
  const color = AV[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AV.length];
  return src ? (
    <img
      src={assetUrl(src)}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("skeleton", className)} />;
}

export function Spinner({ className }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

export function Stars({ value = 0, size = 14, className }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-warning", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <defs>
            <linearGradient id={`s${i}-${value}`}>
              <stop offset={`${Math.min(1, Math.max(0, value - i + 1)) * 100}%`} stopColor="currentColor" />
              <stop offset="0" stopColor="currentColor" stopOpacity=".25" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#s${i}-${value})`}
            d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.8z"
          />
        </svg>
      ))}
    </span>
  );
}

export function Switch({ checked, onChange, id, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-primary" : "bg-border"
      )}
    >
      <span
        className={cn(
          "inline-block size-[18px] rounded-full bg-card shadow transition-transform",
          checked ? "translate-x-[19px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}
