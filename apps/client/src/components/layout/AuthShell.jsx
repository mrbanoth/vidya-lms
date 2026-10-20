import { useQuery } from "@tanstack/react-query";
import Logo from "./Logo";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";

export default function AuthShell({ children, quote = "Finished my first full course in 3 weeks. The progress tracking kept me honest.", author = "Kavya Reddy, frontend developer" }) {
  const { data } = useQuery({ queryKey: ["stats"], queryFn: () => get("/stats").then((r) => r.data), staleTime: 300_000 });
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-ink-foreground lg:grid lg:content-between">
        <Logo inverted className="relative text-ink-foreground" />
        <figure className="relative grid gap-4">
          <blockquote className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-snug">“{quote}”</blockquote>
          <figcaption className="text-sm opacity-70">{author}</figcaption>
        </figure>
        <div className="relative flex gap-6 text-sm opacity-75">
          <span>{data ? compact(data.learners) : "—"} learners</span>
          <span>{data ? compact(data.courses) : "—"} courses</span>
          <span>{data ? `${data.completionRate}%` : "—"} completion</span>
        </div>
      </aside>
      <main className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="grid w-full max-w-[400px] gap-6">
          <Logo className="lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
