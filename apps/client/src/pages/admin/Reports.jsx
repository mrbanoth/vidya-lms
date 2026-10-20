import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Card, Chip, Kpi, PageHeader, Skeleton } from "@/components/ui";
import { BarList } from "@/components/shared/Charts";
import { get } from "@/lib/api";
import { inr, num } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Reports() {
  useTitle("Reports");
  const [days, setDays] = useState(30);
  const { data: d, isLoading } = useQuery({ queryKey: ["admin-reports", days], queryFn: () => get("/admin/reports", { days }).then((r) => r.data) });
  return (
    <>
      <PageHeader title="Reports" description="Learning and revenue health for the period." />
      <div className="flex gap-2">{[[30, "30 days"], [90, "Quarter"], [365, "Year"]].map(([v, l]) => <Chip key={v} active={days === v} onClick={() => setDays(v)}>{l}</Chip>)}</div>
      {isLoading ? <Skeleton className="h-96" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Course completion" value={`${d.completionRate}%`} hint="Of enrollments in period" />
            <Kpi label="Minutes per active learner / day" value={d.avgMinutesPerLearner} />
            <Kpi label="Refund rate" value={`${d.refundRate}%`} />
            <Kpi label="New user → buyer" value={`${d.conversion}%`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="grid content-start gap-4">
              <h2 className="text-lg font-bold">Completion funnel{d.funnelCourse ? ` · ${d.funnelCourse}` : ""}</h2>
              <BarList items={d.funnel.map((f) => ({ label: `${f.label} (${f.pct}%)`, value: f.value }))} format={num} />
            </Card>
            <Card className="grid content-start gap-3">
              <h2 className="text-lg font-bold">Top instructors by sales</h2>
              {d.topInstructors.map((t, i) => (
                <div key={t._id} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                  <Avatar name={t.name} src={t.avatar} size={32} />
                  <b className="flex-1 text-sm">{t.name}</b>
                  <span className="tabular font-mono text-sm">{inr(t.total)}</span>
                </div>
              ))}
              {d.topInstructors.length === 0 && <p className="text-sm text-muted-foreground">No sales in this period.</p>}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
