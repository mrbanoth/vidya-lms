import { Link } from "react-router";
import { cn } from "@/lib/utils";

export default function Logo({ to = "/", label = "Vidya", className, inverted }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2 font-display text-xl font-extrabold", className)}>
      <span className="relative grid size-7 place-items-center rounded-lg bg-primary" aria-hidden>
        <span
          className={cn(
            "ml-0.5 border-y-[6px] border-l-[9px] border-y-transparent",
            inverted ? "border-l-ink" : "border-l-card"
          )}
        />
      </span>
      {label}
    </Link>
  );
}
