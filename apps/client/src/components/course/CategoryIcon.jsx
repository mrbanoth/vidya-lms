import { BarChart3, Briefcase, Cloud, Code2, Palette, Smartphone, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP = [
  [/web|develop|program/i, Code2, "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"],
  [/data|ai|machine/i, BarChart3, "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"],
  [/design|ui|ux/i, Palette, "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"],
  [/mobile|app/i, Smartphone, "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"],
  [/cloud|devops/i, Cloud, "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300"],
  [/career|business|growth|market/i, Briefcase, "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"],
];

export default function CategoryIcon({ name = "", className }) {
  const [, Icon, tone] = MAP.find(([rx]) => rx.test(name)) || [null, Sparkles, "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"];
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tone, className)}>
      <Icon className="size-5" />
    </span>
  );
}
