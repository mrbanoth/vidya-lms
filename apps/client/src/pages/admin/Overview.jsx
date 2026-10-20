import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, ClipboardCheck, IndianRupee, Users } from "lucide-react";
import MetricCard from "@/components/kokonut/metric-card";
import { Card, Kpi, PageHeader, Skeleton } from "@/components/ui";
import { DonutChart, TrendChart } from "@/components/shared/Charts";
import { get } from "@/lib/api";
import { compact, inr, num, timeAgo } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

export default function Overview() {
  useTitle("Admin overview");
  const { data: d, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => get("/admin/overview").then((r) => r.data), refetchInterval: 60_000 });
  if (isLoading) return <Skeleton className="h-[600px]" />;
  const attention = [
    [`${d.pendingReview} courses waiting for review`, "/admin/courses", d.pendingReview ? "amber" : "ok"],
    [`${d.refundsPending} refund requests`, "/admin/payments?status=refund_requested", d.refundsPending ? "amber" : "ok"],
    [`${d.payoutsPending} instructor payouts to send`, "/admin/payouts", d.payoutsPending ? "amber" : "ok"],
    [`${d.failedPayments} failed payments in 30 days`, "/admin/payments?status=failed", d.failedPayments > 20 ? "red" : "ok"],
  ];
  const dot = { ok: "bg-primary", amber: "bg-warning", red: "bg-destructive" };
  return (
    <>
      <PageHeader title="Welcome, Admin 👋" description={`${num(d.totals.users)} users · ${num(d.totals.courses)} live courses · ${num(d.totals.enrollments)} enrollments`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Users} tone="indigo" label="Active users (30 days)" value={num(d.activeUsers)} delta={`${d.activeUsersChange >= 0 ? "+" : ""}${d.activeUsersChange}%`} down={d.activeUsersChange < 0} />
        <Kpi icon={IndianRupee} tone="green" label="Gross sales (30 days)" value={inr(d.gmv)} delta={`${d.gmvChange >= 0 ? "+" : ""}${d.gmvChange}%`} down={d.gmvChange < 0} />
        <Kpi icon={ClipboardCheck} tone="amber" label="Courses pending review" value={d.pendingReview} />
        <Kpi icon={AlertTriangle} tone="rose" label="Failed payments (30 days)" value={d.failedPayments} delta={`${d.failedChange >= 0 ? "+" : ""}${d.failedChange} vs prev`} down={d.failedChange > 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <MetricCard className="w-full max-w-none" label="Gross sales" segments={["UPI", "Card", "Other"]} data={d.gmvDaily} events={[]} periods={[7, 30, 60]} defaultPeriod={30} currency="INR" />
        <Card className="grid content-start gap-4">
          <h2 className="text-lg font-bold">Course Categories · sales</h2>
          <DonutChart items={d.revenueByCategory.map((r) => ({ label: r.name, value: r.total }))} format={(v) => `₹${compact(v)}`} />
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="grid gap-3">
          <h2 className="text-lg font-bold">User Growth · daily sign-ups</h2>
          <TrendChart data={d.signups.map((s) => ({ ...s, label: s.day.slice(5) }))} x="label" y="count" height={200} />
        </Card>
        <Card className="grid content-start gap-3">
          <h2 className="text-lg font-bold">Needs attention</h2>
          {attention.map(([t, to, tone]) => (
            <Link key={t} to={to} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
              <span className={cn("size-2.5 rounded-full", dot[tone])} />
              <span className="flex-1 text-sm font-semibold">{t}</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
          <h3 className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent admin activity</h3>
          {d.recent.map((a) => (
            <div key={a._id} className="text-sm"><b>{a.actorName}</b> <span className="text-xs font-semibold text-primary">{a.action}</span> {a.targetLabel}<div className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</div></div>
          ))}
        </Card>
      </div>
    </>
  );
}
