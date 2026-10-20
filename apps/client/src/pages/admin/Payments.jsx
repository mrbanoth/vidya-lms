import { useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Chip, DataTable, Kpi, Modal, PageHeader, Pagination, Skeleton, StatusPill } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { dateTime, inr, money } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

const FILTERS = [["all", "All"], ["paid", "Paid"], ["refund_requested", "Refund requests"], ["refunded", "Refunded"], ["failed", "Failed"]];

export default function Payments() {
  useTitle("Payments");
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "all";
  const [page, setPage] = useState(1);
  const [refund, setRefund] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-payments", status, page], queryFn: () => get("/admin/payments", { status, page }) });
  const decide = useMutation({
    mutationFn: ({ id, decision }) => post(`/admin/payments/${id}/refund`, { decision }),
    onSuccess: (_r, v) => { toast.success(v.decision === "approve" ? "Refund sent and access removed" : "Refund declined"); setRefund(null); qc.invalidateQueries({ queryKey: ["admin-payments"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const s = data?.meta.summary;
  return (
    <>
      <PageHeader title="Payments & refunds" />
      {s && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Collected (30 days)" value={inr(s.collected)} />
          <Kpi label="Refunded (30 days)" value={inr(s.refunded)} />
          <Kpi label="Refund requests" value={s.refundRequests} />
          <Kpi label="Instructor payouts due" value={inr(s.payoutsDue)} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">{FILTERS.map(([v, l]) => <Chip key={v} active={status === v} onClick={() => { setParams(v === "all" ? {} : { status: v }); setPage(1); }}>{l}</Chip>)}</div>
      {isLoading ? <Skeleton className="h-96" /> : (
        <>
          <DataTable
            rows={data.data}
            columns={[
              { key: "inv", label: "Order", render: (o) => <span className="font-mono text-xs">{o.invoiceNo || o._id.slice(-8)}</span> },
              { key: "user", label: "Learner", render: (o) => <div><b className="block">{o.user?.name}</b><span className="text-xs text-muted-foreground">{o.user?.email}</span></div> },
              { key: "items", label: "Courses", render: (o) => <span className="block max-w-[200px] truncate">{o.items.map((i) => i.title).join(", ")}</span> },
              { key: "total", label: "Amount", render: (o) => money(o.total) },
              { key: "gw", label: "Gateway", render: (o) => <span className="capitalize">{o.gateway} · {o.method || "—"}</span> },
              { key: "date", label: "Date", render: (o) => dateTime(o.paidAt || o.createdAt) },
              { key: "status", label: "Status", render: (o) => <StatusPill status={o.status} /> },
              { key: "act", label: "", render: (o) => o.status === "refund_requested" && <Button size="sm" onClick={() => setRefund(o)}>Review refund</Button> },
            ]}
          />
          <Pagination page={page} pages={data.meta.pages} onChange={setPage} />
        </>
      )}
      <Modal
        open={Boolean(refund)}
        onOpenChange={(o) => !o && setRefund(null)}
        title="Refund request"
        description={refund && `${money(refund.total)} · ${refund.items.map((i) => i.title).join(", ")}`}
        footer={<><Button variant="outline" onClick={() => decide.mutate({ id: refund._id, decision: "reject" })}>Decline</Button><Button onClick={() => decide.mutate({ id: refund._id, decision: "approve" })} disabled={decide.isPending}>Approve refund</Button></>}
      >
        <div className="rounded-xl bg-muted p-4 text-sm"><span className="text-xs text-muted-foreground">Reason from learner</span><p className="mt-1">{refund?.refund?.reason}</p></div>
        <p className="text-sm text-muted-foreground">Approving refunds the full amount through the gateway and removes course access.</p>
      </Modal>
    </>
  );
}
