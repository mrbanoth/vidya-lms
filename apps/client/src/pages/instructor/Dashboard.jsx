import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import MetricCard from "@/components/kokonut/metric-card";
import { Avatar, Button, Card, Kpi, PageHeader, Skeleton, Stars } from "@/components/ui";
import { BarList } from "@/components/shared/Charts";
import { get } from "@/lib/api";
import { inr, num, timeAgo } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";

const pct = (a, b) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}% vs prev 30 days` : a ? "First sales this month" : undefined);

export default function InstructorDashboard() {
  useTitle("Instructor dashboard");
  const user = useAuth((s) => s.user);
  const { data: d, isLoading } = useQuery({ queryKey: ["instructor-dashboard"], queryFn: () => get("/instructor/dashboard").then((r) => r.data) });
  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={d ? `${num(d.totalStudents)} learner${d.totalStudents === 1 ? "" : "s"} across ${d.courses} course${d.courses === 1 ? "" : "s"}.` : " "}
        actions={<Button asChild><Link to="/studio/courses/new"><Plus /> New course</Link></Button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <Kpi label="Your revenue (30 days)" value={inr(d.revenue30)} delta={pct(d.revenue30, d.revenuePrev30)} down={d.revenue30 < d.revenuePrev30} />
            <Kpi label="New learners (30 days)" value={num(d.newStudents30)} delta={pct(d.newStudents30, d.newStudentsPrev)} down={d.newStudents30 < d.newStudentsPrev} />
            <Kpi label="Average rating" value={d.rating || "–"} hint={`${num(d.reviewsCount)} reviews`} />
            <Kpi label="Refund rate" value={`${d.refundRate}%`} hint="Last 30 days" />
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
