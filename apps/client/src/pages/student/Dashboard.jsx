import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { Button, Card, EmptyState, Kpi, Progress, Skeleton } from "@/components/ui";
import CourseThumb from "@/components/course/CourseThumb";
import { get } from "@/lib/api";
import { glyph } from "@/lib/format";
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
  const stats = useQuery({ queryKey: ["my-stats"], queryFn: () => get("/users/me/stats").then((r) => r.data) });
  const courses = useQuery({ queryKey: ["my-courses"], queryFn: () => get("/learn/my-courses").then((r) => r.data) });
  const recs = useQuery({ queryKey: ["recs"], queryFn: () => get("/courses", { sort: "rating", limit: 6 }).then((r) => r.data) });

  const inProgress = (courses.data || []).filter((e) => e.progress < 100);
  const current = inProgress[0];
  const owned = new Set((courses.data || []).map((e) => e.course._id));
  const s = stats.data;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold">{greeting()}, {user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">
            {current
              ? `You are ${100 - current.progress}% away from finishing ${current.course.title}.`
              : "Pick a course and start your streak today."}
          </p>
        </div>
        {current && (
          <Button asChild>
            <Link to={`/learn/${current.course._id}`}>Continue learning <ArrowRight /></Link>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {s ? (
          <>
            <Kpi label="Enrolled courses" value={s.enrolled} />
            <Kpi label="Completed" value={s.completed} />
            <Kpi label="Hours this week" value={s.hoursThisWeek} delta={`${s.hoursThisWeek >= s.hoursLastWeek ? "+" : ""}${(s.hoursThisWeek - s.hoursLastWeek).toFixed(1)} vs last week`} down={s.hoursThisWeek < s.hoursLastWeek} />
            <Kpi label="Current streak" value={`${s.streak} day${s.streak === 1 ? "" : "s"}`} hint={s.streak ? "Study today to keep it" : "Start one today"} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="grid content-start gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">In progress</h2>
            <Link to="/my-learning" className="text-sm font-semibold text-primary">View all</Link>
          </div>
          {courses.isLoading && <Skeleton className="h-40" />}
          {!courses.isLoading && inProgress.length === 0 && (
            <EmptyState icon={BookOpenCheck} title="Nothing in progress" body="Enroll in a course to see it here." action={<Button size="sm" asChild><Link to="/courses">Browse courses</Link></Button>} />
          )}
          {inProgress.slice(0, 4).map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold text-white" style={{ background: e.course.color }}>{glyph(e.course.title)}</span>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{e.course.title}</b>
                <span className="block truncate text-xs text-muted-foreground">Next: {e.lastLesson?.title || "First lesson"}</span>
              </div>
              <Progress value={e.progress} className="hidden w-28 sm:block" />
              <span className="w-10 text-right font-mono text-xs">{e.progress}%</span>
              <Button size="sm" variant="outline" asChild><Link to={`/learn/${e.course._id}`}>Resume</Link></Button>
            </div>
          ))}
        </Card>
        <Card className="grid content-start gap-4">
          <h2 className="text-lg font-bold">Study activity · 12 weeks</h2>
          {s ? <Heatmap activity={s.activity} /> : <Skeleton className="h-32" />}
        </Card>
      </div>
      <section className="grid gap-4">
        <h2 className="text-lg font-bold">Recommended for you</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-3">
          {(recs.data || []).filter((c) => !owned.has(c._id)).slice(0, 4).map((c) => (
            <Link key={c._id} to={`/courses/${c.slug}`} className="overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5">
              <CourseThumb course={c} className="aspect-[2.4]" />
              <div className="grid gap-0.5 p-3">
                <b className="line-clamp-1 text-sm">{c.title}</b>
                <span className="text-xs text-muted-foreground">★ {c.ratingAvg} · {c.instructor?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
