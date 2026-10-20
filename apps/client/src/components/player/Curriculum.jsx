import { Check, FileText, HelpCircle, Lock, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui";
import { duration } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON = { video: PlayCircle, article: FileText, quiz: HelpCircle };

export default function Curriculum({ data, currentId, onSelect }) {
  const done = data.sections.flatMap((s) => s.lessons).filter((l) => l.completed).length;
  const total = data.sections.reduce((t, s) => t + s.lessons.length, 0);
  return (
    <div className="flex h-full flex-col">
      <div className="grid gap-2 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Course content</h2>
          <span className="font-mono text-xs text-muted-foreground">{done}/{total}</span>
        </div>
        <Progress value={data.progress} label="Course progress" />
      </div>
      <nav className="flex-1 overflow-y-auto pb-6" aria-label="Lessons">
        {data.sections.map((s, si) => (
          <div key={s._id}>
            <p className="px-4 pb-1.5 pt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {si + 1} · {s.title}
            </p>
            {s.lessons.map((l) => {
              const Icon = ICON[l.type] || PlayCircle;
              const active = l._id === currentId;
              const locked = !data.enrolled && !l.isPreview && false;
              return (
                <button
                  key={l._id}
                  onClick={() => onSelect(l)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                    active && "bg-accent font-semibold text-accent-foreground hover:bg-accent"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-border",
                      l.completed && "border-primary bg-primary text-primary-foreground",
                      active && !l.completed && "border-[5px] border-primary"
                    )}
                  >
                    {l.completed && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  {locked ? <Lock className="size-3.5 text-muted-foreground" /> : <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
                  <span className="w-12 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                    {l.type === "quiz" ? "Quiz" : duration(l.duration)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
