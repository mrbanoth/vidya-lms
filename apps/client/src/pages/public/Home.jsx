import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Code2, Gauge, GraduationCap, Search } from "lucide-react";
import TypewriterTitle from "@/components/kokonut/type-writer";
import { Avatar, Button, EmptyState, Stars } from "@/components/ui";
import { CourseGrid } from "@/components/course/CourseCard";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import { useConfig } from "@/hooks/useConfig";
import HeroIllustration from "@/components/shared/HeroIllustration";
import CategoryIcon from "@/components/course/CategoryIcon";

const FEATURES = [
  [Code2, "Learn by building", "Every course ends with a real project you can push to GitHub and show in interviews."],
  [Gauge, "Track every lesson", "Resume where you stopped, keep a streak, and always know what is left."],
  [BadgeCheck, "Certificates that verify", "Each certificate has a public link and QR code that employers can check."],
];

export default function Home() {
  useTitle();
  const config = useConfig();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["home"], queryFn: () => get("/home").then((r) => r.data) });

  return (
    <div className="grid gap-16 pb-4">
      <section className="container-page pt-6">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[28px] bg-hero px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:px-14 lg:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative grid gap-6">
            <span className="inline-flex items-center gap-2 justify-self-start rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              Learn <span className="text-muted-foreground">•</span> Practice <span className="text-muted-foreground">•</span> Grow
            </span>
            <h1 className="text-[clamp(2.3rem,5vw,3.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Build skills for a{" "}
              <TypewriterTitle
                as="span"
                className="justify-start !font-sans !text-primary"
                textClassName="!text-[length:inherit] !leading-[inherit]"
                sequences={[
                  { text: "better tomorrow", pauseAfter: 2400 },
                  { text: "brighter career", pauseAfter: 2400 },
                  { text: "dream job", pauseAfter: 2400 },
                ]}
                autoLoop
              />
            </h1>
            <p className="max-w-[48ch] text-[17px] text-muted-foreground">
              High-quality online courses from expert instructors. Learn at your own pace and achieve your goals.
            </p>
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/courses${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
              }}
              className="flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-1.5 pl-4 shadow-[0_12px_30px_-18px_rgba(79,70,229,.45)]"
            >
              <label htmlFor="hero-q" className="sr-only">Search courses</label>
              <input
                id="hero-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for courses, skills, or instructors..."
                className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
              />
              <Button type="submit" size="icon" className="size-11 rounded-xl" aria-label="Search"><Search /></Button>
            </form>
            {data && data.stats.courses > 0 && (
              <dl className="flex flex-wrap gap-x-10 gap-y-4">
                {[
                  [compact(data.stats.learners), "Students"],
                  [compact(data.stats.courses), "Courses"],
                  [compact(data.stats.instructors), "Instructors"],
                  ...(data.stats.avgRating ? [[`${data.stats.avgRating}★`, "Average rating"]] : []),
                ].map(([n, label]) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="tabular text-2xl font-extrabold text-primary">{n}</dd>
                    <dd className="text-xs text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
            <HeroIllustration />
          </motion.div>
        </div>
      </section>

      <section className="container-page grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Popular Categories</h2>
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
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_-20px_rgba(79,70,229,.4)]"
              >
                <CategoryIcon name={c.name} />
                <span className="grid min-w-0">
                  <b className="truncate text-sm">{c.name}</b>
                  <span className="text-xs text-muted-foreground">{c.courseCount ? `${c.courseCount} course${c.courseCount === 1 ? "" : "s"}` : "Coming soon"}</span>
                </span>
              </Link>
            ) : (
              <div key={c._id} className="skeleton h-[72px] rounded-xl" />
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
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-primary px-8 py-10 text-primary-foreground">
          <div className="grid gap-2">
            <h2 className="text-3xl font-bold">Teach what you know</h2>
            <p className="max-w-[52ch] opacity-75">Keep {config.revenueShare}% of every sale. We handle payments, video hosting and certificates.</p>
          </div>
          <Button size="lg" variant="secondary" onClick={() => navigate("/teach")}>Become an instructor</Button>
        </div>
      </section>
    </div>
  );
}
