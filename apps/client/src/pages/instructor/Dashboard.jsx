import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Plus, Star, Undo2, Users } from "lucide-react";
import MetricCard from "@/components/kokonut/metric-card";
import CourseThumb from "@/components/course/CourseThumb";
import { Avatar, Button, Card, Kpi, PageHeader, Skeleton, Stars, StatusPill } from "@/components/ui";
import { BarList } from "@/components/shared/Charts";
import { get } from "@/lib/api";
import { inr, num, timeAgo } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";

const pct = (a, b) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}% vs prev 30 days` : a ? "First sales this month" : undefined);

export default function InstructorDashboard() {
  useTitle("Instructor dashboard");
  const user = useAuth((s) => s.user);
  const courses = useQuery({ queryKey: ["instructor-courses"], queryFn: () => get("/instructor/courses").then((r) => r.data) });
  const { data: d, isLoading } = useQuery({ queryKey: ["instructor-dashboard"], queryFn: () => get("/instructor/dashboard").then((r) => r.data) });
  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}! 👋`}
        description={d ? `${num(d.totalStudents)} learner${d.totalStudents === 1 ? "" : "s"} across ${d.courses} course${d.courses === 1 ? "" : "s"}.` : " "}
        actions={<Button asChild><Link to="/studio/courses/new"><Plus /> New course</Link></Button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <Kpi icon={IndianRupee} tone="green" label="Your revenue (30 days)" value={inr(d.revenue30)} delta={pct(d.revenue30, d.revenuePrev30)} down={d.revenue30 < d.revenuePrev30} />
            <Kpi icon={Users} tone="indigo" label="New learners (30 days)" value={num(d.newStudents30)} delta={pct(d.newStudents30, d.newStudentsPrev)} down={d.newStudents30 < d.newStudentsPrev} />
            <Kpi icon={Star} tone="amber" label="Average rating" value={d.rating || "–"} hint={`${num(d.reviewsCount)} reviews`} />
            <Kpi icon={Undo2} tone="rose" label="Refund rate" value={`${d.refundRate}%`} hint="Last 30 days" />
          </>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {d ? (
          <MetricCard
            className="w-full max-w-none"
            label="Your earnings"
            segments={d.dailySegments}
            data={d.daily}
            events={[]}
            periods={[7, 30, 60]}
            defaultPeriod={30}
            format="currency"
            currency="INR"
          />
        ) : <Skeleton className="h-80" />}
        <Card className="grid content-start gap-4">
          <h2 className="text-lg font-bold">Earnings by course · 30 days</h2>
          {d ? <BarList items={d.byCourse.map((c) => ({ label: c.title, value: c.revenue }))} format={(v) => inr(v)} /> : <Skeleton className="h-40" />}
        </Card>
      </div>
      <Card className="grid gap-4 p-0">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-lg font-bold">Recent Courses</h2>
          <Link to="/studio/courses" className="text-sm font-semibold text-primary">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="tabular w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/60 text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-semibold">Course</th>
                <th className="px-3 py-2.5 font-semibold">Students</th>
                <th className="px-3 py-2.5 font-semibold">Rating</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(courses.data || []).slice(0, 5).map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <CourseThumb course={c} compact className="w-16 shrink-0 rounded-md" />
                      <b className="max-w-[260px] truncate font-semibold">{c.title}</b>
                    </div>
                  </td>
                  <td className="px-3 py-3">{num(c.studentsCount)}</td>
                  <td className="px-3 py-3">{c.ratingCount ? <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-warning text-warning" />{c.ratingAvg}</span> : "—"}</td>
                  <td className="px-3 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-5 py-3 text-right"><Link to={`/studio/courses/${c._id}`} className="font-semibold text-primary">Edit</Link></td>
                </tr>
              ))}
              {courses.data?.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No courses yet. <Link to="/studio/courses/new" className="font-semibold text-primary">Create your first course</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="grid content-start gap-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Unanswered questions</h2><Link to="/studio/qa" className="text-sm font-semibold text-primary">Open inbox</Link></div>
          {d?.openQuestions.length === 0 && <p className="text-sm text-muted-foreground">Inbox zero. Nice.</p>}
          {d?.openQuestions.map((q) => (
            <Link key={q._id} to="/studio/qa" className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted">
              <Avatar name={q.user?.name} src={q.user?.avatar} size={34} />
              <div className="min-w-0 flex-1"><b className="block truncate text-sm">{q.title}</b><span className="text-xs text-muted-foreground">{q.user?.name} · {q.course?.title} · {timeAgo(q.createdAt)}</span></div>
            </Link>
          ))}
        </Card>
        <Card className="grid content-start gap-4">
          <h2 className="text-lg font-bold">Latest reviews</h2>
          {d?.recentReviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {d?.recentReviews.map((r) => (
            <div key={r._id} className="grid gap-1 border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-2"><Stars value={r.rating} size={12} /><span className="text-xs text-muted-foreground">{r.user?.name} · {r.course?.title}</span></div>
              {r.comment && <p className="line-clamp-2 text-sm">{r.comment}</p>}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
