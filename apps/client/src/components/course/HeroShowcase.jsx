import { Link } from "react-router";
import { Avatar, Stars } from "@/components/ui";
import { compact } from "@/lib/format";
import CourseThumb from "./CourseThumb";
import Price from "./Price";

/**
 * Hero visual built from live catalogue data: the top course as a large card,
 * two runners-up and a real learner review. Renders nothing without data.
 */
export default function HeroShowcase({ courses = [], review }) {
  const [top, ...rest] = courses;
  if (!top) return null;
  return (
    <div className="grid gap-3">
      <Link to={`/courses/${top.slug}`} className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
        <CourseThumb course={top} large />
        <div className="grid gap-2 p-4">
          <b className="line-clamp-1 text-base">{top.title}</b>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground"><Avatar name={top.instructor?.name} src={top.instructor?.avatar} size={22} />{top.instructor?.name}</span>
            {top.ratingCount > 0 && <span className="flex items-center gap-1"><b className="text-warning">{top.ratingAvg.toFixed(1)}</b><Stars value={top.ratingAvg} size={12} /><span className="text-xs text-muted-foreground">({compact(top.studentsCount)} learners)</span></span>}
          </div>
          <Price course={top} />
        </div>
      </Link>
      <div className="grid gap-3 sm:grid-cols-2">
        {rest.slice(0, 2).map((c) => (
          <Link key={c._id} to={`/courses/${c.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40">
            <CourseThumb course={c} compact className="w-20 shrink-0 rounded-lg" />
            <span className="grid min-w-0 gap-0.5">
              <b className="truncate text-sm">{c.title}</b>
              <span className="truncate text-xs text-muted-foreground">{c.instructor?.name}</span>
            </span>
          </Link>
        ))}
      </div>
      {review && (
        <figure className="grid gap-2 rounded-xl border border-border bg-card p-4">
          <blockquote className="line-clamp-2 text-sm">“{review.comment}”</blockquote>
          <figcaption className="flex items-center gap-2 text-xs text-muted-foreground"><Avatar name={review.user?.name} src={review.user?.avatar} size={20} />{review.user?.name}<Stars value={review.rating} size={11} /></figcaption>
        </figure>
      )}
    </div>
  );
}
