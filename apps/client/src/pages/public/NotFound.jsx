import { Link } from "react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui";
import { useTitle } from "@/hooks/useTitle";

/** Lost-page art: a magnifier over an empty page, drawn with UI pieces. */
function LostArt() {
  return (
    <div aria-hidden className="relative mx-auto aspect-[1.3] w-full max-w-[340px]">
      <div className="absolute inset-x-[12%] inset-y-[8%] rounded-full bg-primary/10" />
      <div className="absolute left-[22%] top-[18%] w-[52%] rotate-[-4deg] rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex gap-1.5">{["bg-rose-400", "bg-amber-400", "bg-emerald-400"].map((c) => <span key={c} className={`size-2 rounded-full ${c}`} />)}</div>
        <div className="grid gap-2">{["w-full", "w-4/5", "w-3/5", "w-4/5"].map((w, i) => <span key={i} className={`h-2 rounded-full bg-muted ${w}`} />)}</div>
      </div>
      <div className="absolute bottom-[10%] right-[16%] grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
        <Search className="size-9" strokeWidth={2.25} />
      </div>
      <span className="absolute left-[14%] top-[64%] grid size-10 place-items-center rounded-full bg-card text-lg font-bold text-primary shadow-sm">?</span>
    </div>
  );
}

export default function NotFound() {
  useTitle("Page not found");
  return (
    <div className="container-page grid place-items-center py-16 text-center">
      <div className="grid justify-items-center gap-4">
        <LostArt />
        <span className="font-display text-6xl font-extrabold leading-none text-primary">404</span>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="max-w-[44ch] text-muted-foreground">The link may have moved or has a typo. Search for a course, or head back home.</p>
        <div className="flex gap-2">
          <Button asChild><Link to="/">Go home</Link></Button>
          <Button variant="outline" asChild><Link to="/courses">Browse courses</Link></Button>
        </div>
      </div>
    </div>
  );
}
