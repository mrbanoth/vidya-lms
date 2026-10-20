import { Link, useNavigate } from "react-router";
import { Button, Kpi } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";
import { useConfig } from "@/hooks/useConfig";

const STEPS = [
  ["Plan", "Outline sections and lessons in the drag-and-drop curriculum builder."],
  ["Record", "Upload videos, articles and quizzes. We host and stream them."],
  ["Submit", "Our team reviews quality within 48 hours."],
  ["Earn", "Keep your share of every sale and withdraw to UPI."],
];

export default function Teach() {
  useTitle("Teach on Vidya");
  const user = useAuth((s) => s.user);
  const config = useConfig();
  const navigate = useNavigate();
  const start = () => navigate(!user ? "/sign-up?role=instructor" : user.role === "student" ? "/contact" : "/studio/courses/new");
  return (
    <div className="container-page grid gap-16 py-12">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="grid gap-5">
          <span className="eyebrow">Teach on Vidya</span>
          <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-[1.05]">Turn what you know into <span className="text-primary">a course people finish</span>.</h1>
          <p className="text-lg text-muted-foreground">Plan, record and publish with the studio. We handle payments, hosting, certificates and support.</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={start}>Start your first course</Button>
            {user?.role !== "student" && user && <Button variant="outline" size="lg" asChild><Link to="/studio">Open studio</Link></Button>}
          </div>
          {user?.role === "student" && <p className="text-sm text-muted-foreground">Signed in as a learner. Contact us to switch your account to an instructor account.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Your revenue share" value={`${config.revenueShare}%`} />
          <Kpi label="Refund hold" value="30 days" />
          <Kpi label="Payout minimum" value="₹500" />
          <Kpi label="Payout method" value="UPI" />
        </div>
      </section>
      <section className="grid gap-6">
        <h2 className="text-3xl font-bold">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {STEPS.map(([t, b], i) => (
            <li key={t} className="grid gap-2 rounded-2xl border border-border bg-card p-6">
              <span className="font-mono text-xs text-primary">Step {i + 1}</span>
              <h3 className="text-xl font-bold">{t}</h3>
              <p className="text-muted-foreground">{b}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
