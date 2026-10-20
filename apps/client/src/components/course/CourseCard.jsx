import { Link, useNavigate } from "react-router";
import { Heart } from "lucide-react";
import { Badge, Stars } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useWishlist } from "@/features/cart/useCart";
import { compact, duration } from "@/lib/format";
import { cn } from "@/lib/utils";
import CourseThumb from "./CourseThumb";
import Price from "./Price";

export default function CourseCard({ course, className }) {
  const user = useAuth((s) => s.user);
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const saved = wishlist.has(course._id);

  return (
    <article
      className={cn(
        "group relative grid grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(10,30,20,.45)]",
        className
      )}
    >
      <CourseThumb course={course}>
        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-white">
          {course.level}
        </span>
        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            if (!user) return navigate(`/sign-in?next=/courses/${course.slug}`);
            wishlist.toggle.mutate({ course, on: !saved });
          }}
          className="absolute right-2 top-2 z-10 grid size-8 cursor-pointer place-items-center rounded-full bg-black/40 text-white transition hover:scale-110"
        >
          <Heart className={cn("size-4", saved && "fill-current")} />
        </button>
      </CourseThumb>
      <div className="grid content-start gap-1.5 p-4 text-[13px]">
        {course.bestseller && <Badge tone="amber" className="justify-self-start">Bestseller</Badge>}
        <h3 className="line-clamp-2 font-sans text-[15px] font-bold leading-snug">
          <Link to={`/courses/${course.slug}`} className="after:absolute after:inset-0">
            {course.title}
          </Link>
        </h3>
        <span className="text-muted-foreground">{course.instructor?.name}</span>
        <div className="flex items-center gap-1.5">
          <b className="text-warning">{course.ratingAvg?.toFixed(1) || "New"}</b>
          {course.ratingCount > 0 && <Stars value={course.ratingAvg} size={12} />}
          <span className="text-muted-foreground">({compact(course.ratingCount)})</span>
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <Price course={course} />
          <span className="font-mono text-[11px] text-muted-foreground">
            {duration(course.totalDuration)} · {course.totalLessons} lessons
          </span>
        </div>
      </div>
    </article>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="skeleton aspect-video rounded-none" />
      <div className="grid gap-2 p-4">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-2/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="skeleton h-5 w-1/4" />
      </div>
    </div>
  );
}

export function CourseGrid({ courses, loading, count = 8, className }) {
  return (
    <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4", className)}>
      {loading
        ? Array.from({ length: count }, (_, i) => <CourseCardSkeleton key={i} />)
        : courses.map((c) => <CourseCard key={c._id} course={c} />)}
    </div>
  );
}
