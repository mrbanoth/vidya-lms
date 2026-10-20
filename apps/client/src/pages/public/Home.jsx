import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Code2, Gauge, GraduationCap, Search } from "lucide-react";
import BackgroundPaths from "@/components/kokonut/background-paths";
import TypewriterTitle from "@/components/kokonut/type-writer";
import { Avatar, Badge, Button, EmptyState, Progress, Stars } from "@/components/ui";
import { CourseGrid } from "@/components/course/CourseCard";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";
import { useConfig } from "@/hooks/useConfig";

const FEATURES = [
  [Code2, "Learn by building", "Every course ends with a real project you can push to GitHub and show in interviews."],
  [Gauge, "Track every lesson", "Resume where you stopped, keep a streak, and always know what is left."],
  [BadgeCheck, "Certificates that verify", "Each certificate has a public link and QR code that employers can check."],
];

function ContinueCard() {
  const user = useAuth((s) => s.user);
  const { data } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => get("/learn/my-courses").then((r) => r.data),
    enabled: Boolean(user),
  });
  const current = data?.find((e) => e.progress < 100) || data?.[0];
  if (!user || !current)
    return (
      <div className="col-span-2 grid gap-3 rounded-2xl bg-ink p-5 text-ink-foreground">
        <span className="text-xs opacity-70">How it works</span>
        <b className="font-display text-xl">Enroll, learn at your pace, earn a certificate</b>
        <p className="text-sm opacity-70">Short lessons, quizzes after each section and a verifiable certificate when you finish.</p>
        <Link to={user ? "/courses" : "/sign-up"} className="text-sm font-semibold text-primary">{user ? "Browse courses →" : "Create a free account →"}</Link>
      </div>
    );
  return (
    <div className="col-span-2 grid gap-2 rounded-2xl bg-ink p-5 text-ink-foreground">
      <span className="text-xs opacity-70">Continue learning</span>
      <b className="font-display text-xl">{current.course.title}</b>
      <Progress value={current.progress} className="bg-white/15" />
      <div className="flex items-center justify-between text-xs">
        <span className="opacity-75">{current.progress}% complete</span>
        <Button size="sm" asChild>
          <Link to={`/learn/${current.course._id}`}>Resume</Link>
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  useTitle();
  const config = useConfig();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["home"], queryFn: () => get("/home").then((r) => r.data) });

  return (
    <div className="grid gap-20">
      <BackgroundPaths className="border-b border-border text-primary/40" count={36} speed={0.6}>
        <div className="text-foreground">
        <section className="container-page grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-6"
          >
            <Badge className="justify-self-start">Project-based courses · certificates included</Badge>
            <h1 className="text-[clamp(2.2rem,5.4vw,3.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">
              Learn the skill.{" "}
              <TypewriterTitle
                as="span"
                className="justify-start font-display !text-primary"
                textClassName="!text-[length:inherit] !leading-[inherit]"
                sequences={[
                  { text: "Finish the course.", pauseAfter: 2200 },
                  { text: "Build the project.", pauseAfter: 2200 },
                  { text: "Get hired.", pauseAfter: 2200 },
                ]}
                autoLoop
              />
            </h1>
            <p className="max-w-[52ch] text-lg text-muted-foreground">
              Project-based courses from working engineers, with quizzes, certificates and progress you can actually see.
            </p>
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/courses${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
              }}
              className="flex gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-[0_18px_40px_-24px_rgba(10,30,20,.35)]"
            >
              <label htmlFor="hero-q" className="sr-only">Search courses</label>
              <div className="flex min-w-0 flex-1 items-center gap-2 pl-3">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  id="hero-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Try ‘React’, ‘System design’, ‘Node APIs’"
                  className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <Button type="submit" size="lg">Search</Button>
            </form>
            <div className={data && data.stats.courses === 0 ? "hidden" : "flex flex-wrap gap-8"}>
              {[
                [data?.stats.courses, "courses"],
                [data?.stats.learners, "learners"],
                [data?.stats.instructors, "instructors"],
              ].map(([n, label]) => (
                <div key={label}>
                  <b className="tabular block font-display text-3xl font-extrabold">{n == null ? "—" : compact(n)}</b>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <ContinueCard />
            <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 transition-transform hover:-translate-y-1">
              <Badge tone="amber" className="justify-self-start">Quiz</Badge>
              <b>Graded quizzes</b>
              <span className="text-xs text-muted-foreground">Instant feedback with explanations</span>
            </div>
            <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 transition-transform hover:-translate-y-1">
              <Badge tone="blue" className="justify-self-start">Certificate</Badge>
              <b>Verified PDF</b>
              <span className="text-xs text-muted-foreground">With a QR code employers can scan</span>
            </div>
            <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 transition-transform hover:-translate-y-1">
              <Badge className="justify-self-start">Streak</Badge>
              <b className="font-display text-2xl">Daily goals</b>
              <span className="text-xs text-muted-foreground">Heatmap of every minute studied</span>
            </div>
            <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 transition-transform hover:-translate-y-1">
              <Badge tone="red" className="justify-self-start">Q&A</Badge>
              <b>Ask the instructor</b>
              <span className="text-xs text-muted-foreground">Answers inside the lesson</span>
            </div>
          </motion.div>
        </section>
        </div>
      </BackgroundPaths>

      <section className="container-page grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Browse</span>
            <h2 className="text-3xl font-bold">Top categories</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses">All courses <ArrowRight /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-3">
          {(data?.categories || Array.from({ length: 6 }, (_, i) => ({ _id: i }))).map((c) =>
            c.slug ? (
              <Link
                key={c._id}
                to={`/categories/${c.slug}`}
                className="grid gap-1.5 rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary"
              >
                <span className="font-mono text-xl font-semibold text-primary">{c.icon}</span>
                <b>{c.name}</b>
                <span className="text-xs text-muted-foreground">{c.courseCount ? `${c.courseCount} courses` : "Coming soon"}</span>
              </Link>
            ) : (
              <div key={c._id} className="skeleton h-28 rounded-xl" />
            )
          )}
        </div>
      </section>

      <section className="container-page grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Most enrolled</span>
            <h2 className="text-3xl font-bold">Bestsellers</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses?sort=popular">See more <ArrowRight /></Link>
          </Button>
        </div>
        {data && data.bestsellers.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="The first courses are on their way"
            body="Instructors are building courses right now. Create an account to get notified, or teach one yourself."
            action={<Button asChild><Link to="/teach">Teach on Vidya</Link></Button>}
          />
        ) : (
          <CourseGrid courses={data?.bestsellers || []} loading={isLoading} />
        )}
      </section>

      <section className="container-page grid gap-4 md:grid-cols-3">
        {FEATURES.map(([Icon, title, body]) => (
          <div key={title} className="grid gap-3 rounded-2xl border border-border bg-card p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      {data?.reviews?.length > 0 && (
        <section className="container-page grid gap-6">
          <div>
            <span className="eyebrow">Reviews</span>
            <h2 className="text-3xl font-bold">What learners say</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data.reviews.map((r) => (
              <figure key={r._id} className="grid content-between gap-4 rounded-2xl border border-border bg-card p-6">
                <div className="grid gap-3">
                  <Stars value={r.rating} />
                  <blockquote className="text-[15.5px]">“{r.comment}”</blockquote>
                </div>
                <figcaption className="flex items-center gap-3">
                  <Avatar name={r.user?.name} src={r.user?.avatar} size={36} />
                  <b className="text-sm">{r.user?.name}</b>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="container-page">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-ink px-8 py-10 text-ink-foreground">
          <div className="grid gap-2">
            <h2 className="text-3xl font-bold">Teach what you know</h2>
            <p className="max-w-[52ch] opacity-75">Keep {config.revenueShare}% of every sale. We handle payments, video hosting and certificates.</p>
          </div>
          <Button size="lg" onClick={() => navigate("/teach")}>Become an instructor</Button>
        </div>
      </section>
    </div>
  );
}
