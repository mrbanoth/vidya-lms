import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Avatar, Card, Chip, EmptyState, PageHeader, Select, Skeleton, Stars } from "@/components/ui";
import { get } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Reviews() {
  useTitle("Reviews");
  const [course, setCourse] = useState("");
  const [rating, setRating] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["instructor-reviews", course, rating],
    queryFn: () => get("/instructor/reviews", { course: course || undefined, rating: rating || undefined }).then((r) => r.data),
  });
  const s = data?.summary;
  const max = Math.max(1, ...(s?.breakdown.map((b) => b.count) || [0]));
  return (
    <>
      <PageHeader title="Reviews" description="What learners say about your courses." />
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="grid gap-4 p-5">
          {isLoading ? <Skeleton className="h-40" /> : (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl font-extrabold leading-none">{s.average.toFixed(1)}</span>
                <div className="grid gap-1 pb-1"><Stars value={s.average} /><span className="text-xs text-muted-foreground">{s.total} reviews</span></div>
              </div>
              <ul className="grid gap-2">
                {s.breakdown.map((b) => (
                  <li key={b.rating}>
                    <button type="button" onClick={() => setRating(rating === b.rating ? 0 : b.rating)} aria-pressed={rating === b.rating} className="grid w-full cursor-pointer grid-cols-[2.5rem_1fr_2rem] items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-muted aria-pressed:bg-accent">
                      <span className="flex items-center gap-1">{b.rating}<Star className="size-3 fill-warning text-warning" /></span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-warning" style={{ width: `${(b.count / max) * 100}%` }} /></span>
                      <span className="tabular text-right text-xs text-muted-foreground">{b.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <div className="grid min-w-0 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="Filter by course" className="w-auto min-w-56" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All courses</option>
              {data?.courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </Select>
            {rating > 0 && <Chip active onClick={() => setRating(0)}>{rating} stars ✕</Chip>}
          </div>
          {isLoading ? <Skeleton className="h-64" /> : data.items.length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet" body="Reviews from enrolled learners show up here." />
          ) : (
            <ul className="overflow-hidden rounded-xl border border-border bg-card">
              {data.items.map((r) => (
                <li key={r._id} className="grid gap-2 border-b border-border p-5 last:border-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={r.user?.name} src={r.user?.avatar} size={36} />
                    <div className="grid min-w-0 flex-1">
                      <b className="text-sm">{r.user?.name || "Learner"}</b>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground"><Stars value={r.rating} size={12} /> {timeAgo(r.createdAt)}{r.hidden && " · hidden by admin"}</span>
                    </div>
                    {r.course && <Link to={`/courses/${r.course.slug}`} className="truncate text-xs font-semibold text-primary hover:underline">{r.course.title}</Link>}
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
