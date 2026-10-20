import { NavLink, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import Logo from "./Logo";
import HeroShowcase from "@/components/course/HeroShowcase";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Login / Sign up switcher shown above the sign-in and sign-up forms. */
function AuthTabs() {
  const [params] = useSearchParams();
  const qs = params.get("next") ? `?next=${encodeURIComponent(params.get("next"))}` : "";
  const tab = ({ isActive }) =>
    cn(
      "-mb-px border-b-2 px-1 pb-3 text-center text-sm font-semibold transition-colors",
      isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
    );
  return (
    <nav aria-label="Account" className="grid grid-cols-2 gap-6 border-b border-border">
      <NavLink to={`/sign-in${qs}`} className={tab}>Login</NavLink>
      <NavLink to={`/sign-up${qs}`} className={tab}>Sign up</NavLink>
    </nav>
  );
}

export default function AuthShell({ children, tabs = false, title = "Welcome back to Vidya" }) {
  const { data: home } = useQuery({ queryKey: ["home"], queryFn: () => get("/home").then((r) => r.data), staleTime: 300_000 });
  const data = home?.stats;
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[1.05fr_1fr]">
        <aside className="hidden flex-col justify-between gap-6 bg-hero p-10 lg:flex">
          <div className="grid gap-6">
            <Logo />
            <div className="grid gap-2">
              <h2 className="max-w-xs text-3xl font-extrabold leading-tight">{title}</h2>
              <p className="text-muted-foreground">Learn. Teach. Grow.</p>
            </div>
          </div>
          <HeroShowcase courses={home?.bestsellers?.slice(0, 1)} review={home?.reviews?.[0]} />
          <div className="flex gap-6 text-sm text-muted-foreground">
            {data?.courses > 0 && <span><b className="text-foreground">{compact(data.courses)}</b> courses</span>}
            {data?.learners > 0 && <span><b className="text-foreground">{compact(data.learners)}</b> learners</span>}
            {data?.instructors > 0 && <span><b className="text-foreground">{compact(data.instructors)}</b> instructors</span>}
          </div>
        </aside>
        <main className="grid place-items-center px-5 py-10 sm:px-10">
          <div className="grid w-full max-w-[400px] gap-6">
            <Logo className="lg:hidden" />
            {tabs && <AuthTabs />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
