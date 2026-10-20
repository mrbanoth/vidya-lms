import { Link } from "react-router";
import { cn } from "@/lib/utils";

/** Brand mark: a "V" that reads as a learning path converging on a point, with a dot for the learner. */
export function LogoMark({ className, size = 28 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--primary)" />
      <path d="M19 20.5l13 23 13-23" fill="none" stroke="var(--primary-foreground)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="15.5" r="3.5" fill="var(--primary-foreground)" opacity=".7" />
    </svg>
  );
}

export default function Logo({ to = "/", label = "Vidya", className }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5 text-[19px] font-bold tracking-tight", className)}>
      <LogoMark />
      {label}
    </Link>
  );
}
