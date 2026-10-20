import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Numbered course-builder steps: a vertical list beside the form on desktop,
 * a horizontal scroller on small screens. Steps without `onSelect` are shown
 * but not clickable (e.g. before the draft exists).
 */
export default function EditorSteps({ steps, value, onSelect, done = [] }) {
  return (
    <nav aria-label="Course steps" className="-mx-1 overflow-x-auto lg:mx-0 lg:overflow-visible">
      <ol className="flex gap-1 px-1 lg:grid lg:px-0">
        {steps.map(([key, label], i) => {
          const active = key === value;
          const finished = done.includes(key);
          return (
            <li key={key} className="shrink-0">
              <button
                type="button"
                disabled={!onSelect}
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect?.(key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  onSelect && !active && "cursor-pointer hover:bg-muted hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs",
                    active ? "bg-primary text-primary-foreground" : finished ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  )}
                >
                  {finished && !active ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
