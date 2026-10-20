import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, DataTable, Field, Input, Kpi, PageHeader, Skeleton, Spinner, StatusPill } from "@/components/ui";
import { TrendChart } from "@/components/shared/Charts";
import { errorMessage, get, post } from "@/lib/api";
import { date, inr, money } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Earnings() {
  useTitle("Earnings");
  const qc = useQueryClient();
  const { data: d, isLoading } = useQuery({ queryKey: ["earnings"], queryFn: () => get("/instructor/earnings").then((r) => r.data) });
  const [upi, setUpi] = useState("");
  const withdraw = useMutation({
    mutationFn: () => post("/instructor/payouts", { upi: upi || d.payoutUpi }),
    onSuccess: (r) => { toast.success(r.message); qc.invalidateQueries({ queryKey: ["earnings"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (isLoading) return <Skeleton className="h-96" />;
  const monthly = d.monthly.map((m) => ({ ...m, label: new Date(`${m.month}-01`).toLocaleDateString("en-IN", { month: "short" }) }));
  return (
    <>
      <PageHeader title="Earnings & payouts" description={`You keep ${d.share}% of every sale. Sales are held for 30 days to cover refunds.`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Available to withdraw" value={inr(d.available)} />
        <Kpi label="Pending (30-day hold)" value={inr(d.pending)} />
        <Kpi label="Paid out" value={inr(d.paidOut)} />
        <Kpi label="Lifetime earnings" value={inr(d.lifetime)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="grid gap-3">
          <h2 className="text-lg font-bold">Monthly earnings</h2>
          {monthly.length ? <TrendChart data={monthly} x="label" y="amount" prefix="₹" /> : <p className="text-sm text-muted-foreground">No sales yet.</p>}
        </Card>
        <Card as="form" className="grid content-start gap-4" onSubmit={(e) => { e.preventDefault(); withdraw.mutate(); }}>
          <h2 className="text-lg font-bold">Withdraw</h2>
          <Field label="UPI ID" htmlFor="upi" hint="Payouts go out within 2 working days. 1% TDS applies (Section 194-O).">
            <Input id="upi" placeholder="name@bank" defaultValue={d.payoutUpi} onChange={(e) => setUpi(e.target.value)} />
          </Field>
          <Button type="submit" disabled={d.available < 500 || withdraw.isPending}>{withdraw.isPending && <Spinner />} Withdraw {money(d.available)}</Button>
          {d.available < 500 && <p className="text-xs text-muted-foreground">Minimum withdrawal is ₹500.</p>}
        </Card>
      </div>
      <DataTable
        rows={d.payouts}
        empty="No payouts yet."
        columns={[
          { key: "date", label: "Requested", render: (p) => date(p.createdAt) },
          { key: "amount", label: "Amount", render: (p) => money(p.amount) },
          { key: "tds", label: "TDS", render: (p) => money(p.tds) },
          { key: "dest", label: "To", render: (p) => <span className="font-mono text-xs">{p.destination}</span> },
          { key: "ref", label: "Reference", render: (p) => <span className="font-mono text-xs">{p.reference || "—"}</span> },
          { key: "status", label: "Status", render: (p) => <StatusPill status={p.status} /> },
        ]}
      />
    </>
  );
}
