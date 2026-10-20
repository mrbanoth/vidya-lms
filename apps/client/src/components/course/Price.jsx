import { effectivePrice, inr, pctOff } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Price({ course, className, size = "md" }) {
  const p = effectivePrice(course);
  const off = pctOff(course);
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <b className={cn("font-display font-bold", size === "lg" ? "text-3xl" : "text-base")}>{inr(p)}</b>
      {off > 0 && <s className={cn("text-muted-foreground", size === "lg" ? "text-base" : "text-xs")}>{inr(course.price)}</s>}
    </span>
  );
}
