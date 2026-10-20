import { useQuery } from "@tanstack/react-query";
import { Avatar, Kpi } from "@/components/ui";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

const VALUES = [
  ["Finish what you start", "Every design decision is judged by one question: does this help someone finish the course?"],
  ["Teachers who build", "Instructors are working engineers and designers, and every course is reviewed before it goes live."],
  ["Fair to creators", "Instructors keep 70% of every sale and see their numbers live."],
];
const TEAM = [["Banoth", "Founder & Engineer"], ["Lakshmi Iyer", "Head of Content"], ["Vikram Rao", "Platform"], ["Neha Gupta", "Design"]];

export default function About() {
  useTitle("About");
  const { data } = useQuery({ queryKey: ["stats"], queryFn: () => get("/stats").then((r) => r.data) });
  return (
    <div className="container-page grid gap-14 py-12">
      <div className="grid max-w-3xl gap-4">
        <span className="eyebrow">About Vidya</span>
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-extrabold">Most online courses never get finished. We are fixing that.</h1>
        <p className="text-lg text-muted-foreground">Typical completion rates for online courses sit around 15%. Vidya is built around finishing: short lessons, visible progress, real projects and instructors who answer questions.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Completion rate" value={data ? `${data.completionRate}%` : "—"} />
        <Kpi label="Learners" value={data ? compact(data.learners) : "—"} />
        <Kpi label="Instructors" value={data ? compact(data.instructors) : "—"} />
        <Kpi label="Courses" value={data ? compact(data.courses) : "—"} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {VALUES.map(([t, b]) => (
          <div key={t} className="grid gap-2 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">{t}</h2>
            <p className="text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>
      <section className="grid gap-5">
        <h2 className="text-2xl font-bold">Team</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TEAM.map(([n, r]) => (
            <div key={n} className="grid justify-items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center">
              <Avatar name={n} size={64} />
              <b>{n}</b>
              <span className="text-xs text-muted-foreground">{r}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
