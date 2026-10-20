import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, BookOpenCheck, CheckCircle2, Clock, Flame } from "lucide-react";
import { Button, Card, EmptyState, Kpi, Progress, Skeleton } from "@/components/ui";
import CourseThumb from "@/components/course/CourseThumb";
import { get } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Heatmap({ activity }) {
  const map = new Map(activity.map((a) => [a.day, a.minutes]));
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(Date.now() - (83 - i) * 864e5).toISOString().slice(0, 10);
    return [d, map.get(d) || 0];
  });
  const level = (m) => (m === 0 ? 0 : m < 20 ? 1 : m < 45 ? 2 : 3);
  const cls = ["bg-muted", "bg-accent", "bg-primary/55", "bg-primary"];
  return (
    <div className="grid gap-2">
      <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
        {days.map(([d, m]) => (
          <span key={d} title={`${d}: ${Math.round(m)} min`} className={cn("aspect-square rounded-[3px]", cls[level(m)])} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        Less {cls.map((c) => <span key={c} className={cn("size-3 rounded-[3px]", c)} />)} More
      </div>
    </div>
  );
}

export default function Dashboard() {
  useTitle("Dashboard");
  const user = useAuth((s) => s.user);
  const [tab, setTab] = useState("all");
  const stats = useQuery({ queryKey: ["my-stats"], queryFn: () => get("/users/me/stats").then((r) => r.data) });
  const courses = useQuery({ queryKey: ["my-courses"], queryFn: () => get("/learn/my-courses").then((r) => r.data) });
  const recs = useQuery({ queryKey: ["recs"], queryFn: () => get("/courses", { sort: "rating", limit: 8 }).then((r) => r.data) });

  const all = courses.data || [];
  const current = all.find((e) => e.progress < 100);
  const owned = new Set(all.map((e) => e.course._id));
  const list = tab === "progress" ? all.filter((e) => e.progress < 100) : tab === "done" ? all.filter((e) => e.progress === 100) : all;
  const s = stats.data;

  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-extrabold">{greeting()}, {user.name.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground">Keep learning, keep growing.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {s ? (
          <>
            <Kpi icon={BookOpen} tone="indigo" label="Enrolled Courses" value={s.enrolled} />
            <Kpi icon={CheckCircle2} tone="green" label="Completed" value={s.completed} />
            <Kpi icon={Clock} tone="blue" label="Hours this week" value={`${s.hoursThisWeek}h`} />
            <Kpi icon={Flame} tone="amber" label="Day streak" value={s.streak} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[76px]" />)
        )}
      </div>

      <Card className="grid gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Continue Learning</h2>
          <Link to="/my-learning" className="text-sm font-semibold text-primary">View All</Link>
        </div>
        {courses.isLoading ? (
          <Skeleton className="h-28" />
        ) : current ? (
          <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr_auto]">
            <CourseThumb course={current.course} className="rounded-xl" />
            <div className="grid min-w-0 gap-1.5">
              <b className="truncate">{current.course.title}</b>
              <span className="truncate text-sm text-muted-foreground">Next: {current.lastLesson?.title || "First lesson"}</span>
              <Progress value={current.progress} className="max-w-sm" />
              <span className="text-xs font-semibold text-primary">{current.progress}% complete</span>
            </div>
            <Button asChild><Link to={`/learn/${current.course._id}`}>Continue <ArrowRight /></Link></Button>
          </div>
        ) : (
          <EmptyState icon={BookOpenCheck} title="Nothing in progress" body="Enroll in a course to start learning." action={<Button size="sm" asChild><Link to="/courses">Browse courses</Link></Button>} />
        )}
      </Card>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">My Courses</h2>
          <div className="flex gap-1 rounded-full bg-muted p-1 text-sm">
            {[["all", "All"], ["progress", "In Progress"], ["done", "Completed"]].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)} aria-pressed={tab === v} className={cn("cursor-pointer rounded-full px-3.5 py-1.5 font-semibold transition", tab === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {list.length === 0 && !courses.isLoading ? (
          <p className="text-sm text-muted-foreground">No courses here yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
            {list.map((e) => (
              <Link key={e.id} to={`/learn/${e.course._id}`} className="overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30">
                <CourseThumb course={e.course} className="aspect-[2.2]" />
                <div className="grid gap-1.5 p-3.5">
                  <b className="line-clamp-1 text-sm">{e.course.title}</b>
                  <span className="text-xs text-muted-foreground">{e.course.instructor?.name}</span>
                  <Progress value={e.progress} />
                  <span className="text-xs text-muted-foreground">{e.progress}% complete</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="grid content-start gap-4">
          <h2 className="text-lg font-bold">Study activity · 12 weeks</h2>
          {s ? <Heatmap activity={s.activity} /> : <Skeleton className="h-32" />}
        </Card>
        <Card className="grid content-start gap-3">
          <h2 className="text-lg font-bold">Recommended for you</h2>
          {(recs.data || []).filter((c) => !owned.has(c._id)).slice(0, 3).map((c) => (
            <Link key={c._id} to={`/courses/${c.slug}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted">
              <CourseThumb course={c} compact className="w-20 shrink-0 rounded-lg" />
              <div className="grid min-w-0">
                <b className="truncate text-sm">{c.title}</b>
                <span className="text-xs text-muted-foreground">★ {c.ratingAvg || "New"} · {c.instructor?.name}</span>
              </div>
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}
