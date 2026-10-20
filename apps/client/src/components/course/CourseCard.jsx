import { Link, useNavigate } from "react-router";
import { Heart } from "lucide-react";
import { Stars } from "@/components/ui";
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
        "group relative grid grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_12px_32px_-20px_rgba(10,30,20,.35)]",
        className
      )}
    >
      <CourseThumb course={course}>
        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            if (!user) return navigate(`/sign-in?next=/courses/${course.slug}`);
            wishlist.toggle.mutate({ course, on: !saved });
          }}
          className="absolute right-2.5 top-2.5 z-10 grid size-8 cursor-pointer place-items-center rounded-full bg-card/90 text-foreground shadow-sm ring-1 ring-border transition hover:scale-110"
        >
          <Heart className={cn("size-4", saved && "fill-destructive text-destructive")} />
        </button>
      </CourseThumb>
      <div className="grid content-start gap-1.5 p-4 text-[13px]">
        <span className="text-xs text-muted-foreground">
          {course.level}
          {course.bestseller && <span className="font-semibold text-warning"> · Bestseller</span>}
        </span>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">
          <Link to={`/courses/${course.slug}`} className="after:absolute after:inset-0">
            {course.title}
          </Link>
        </h3>
        <span className="text-muted-foreground">{course.instructor?.name}</span>
        <div className="flex items-center gap-1.5">
          {course.ratingCount > 0 ? (
            <>
              <b className="font-semibold">{course.ratingAvg?.toFixed(1)}</b>
              <Stars value={course.ratingAvg} size={12} />
              <span className="text-muted-foreground">({compact(course.ratingCount)})</span>
            </>
          ) : (
            <span className="text-muted-foreground">New course</span>
          )}
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <Price course={course} />
          <span className="text-xs text-muted-foreground">
            {course.totalLessons} lessons · {duration(course.totalDuration)}
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
