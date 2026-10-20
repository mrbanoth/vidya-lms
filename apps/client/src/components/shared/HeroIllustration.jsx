import { BarChart3, GraduationCap, PlayCircle, Rocket, Star } from "lucide-react";

/**
 * Decorative hero art built from UI pieces (no stock photos): a laptop showing
 * a lesson, a progress chart and floating badges, like the product itself.
 */
export default function HeroIllustration() {
  return (
    <div aria-hidden className="relative mx-auto aspect-[1.05] w-full max-w-[520px]">
      <div className="absolute inset-[8%] rounded-full bg-primary/10" />
      <div className="absolute inset-[18%] rounded-full bg-primary/10" />

      {/* laptop */}
      <div className="absolute left-[10%] right-[6%] top-[22%]">
        <div className="overflow-hidden rounded-t-2xl border-[6px] border-b-0 border-slate-800 bg-card shadow-2xl dark:border-slate-600">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="ml-3 h-2 w-24 rounded-full bg-border" />
          </div>
          <div className="grid grid-cols-[1.4fr_1fr] gap-3 p-3">
            <div className="relative grid aspect-video place-items-center rounded-lg bg-slate-900">
              <PlayCircle className="size-10 text-white/90" strokeWidth={1.4} />
              <div className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-white/20">
                <div className="h-full w-2/5 rounded-full bg-primary" />
              </div>
            </div>
            <div className="grid content-start gap-2">
              {[90, 70, 80, 55].map((w, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className={i < 2 ? "size-2.5 rounded-full bg-emerald-500" : "size-2.5 rounded-full border border-border"} />
                  <span className="h-1.5 rounded-full bg-border" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-[-6%] h-3 rounded-b-xl bg-slate-300 dark:bg-slate-700" />
      </div>

      {/* floating badges */}
      <span className="absolute left-[2%] top-[10%] grid size-14 rotate-[-8deg] place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xl">
        <GraduationCap className="size-7" />
      </span>
      <span className="absolute right-[2%] top-[6%] grid size-12 rotate-6 place-items-center rounded-2xl bg-card text-emerald-500 shadow-xl">
        <BarChart3 className="size-6" />
      </span>
      <span className="absolute right-[-2%] top-[46%] grid size-11 place-items-center rounded-full bg-card text-amber-500 shadow-xl">
        <Star className="size-5 fill-current" />
      </span>

      {/* start learning card */}
      <div className="absolute bottom-[4%] right-[4%] flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-xl ring-1 ring-border">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Rocket className="size-4" />
        </span>
        <span className="grid text-left">
          <b className="text-sm">Start Learning Today</b>
          <span className="text-xs text-muted-foreground">Your future skills start here.</span>
        </span>
      </div>
    </div>
  );
}
