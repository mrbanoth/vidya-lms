import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { REFUND_WINDOW_DAYS } from "@vidya/shared";
import { Button, DataTable, Field, Modal, PageHeader, Skeleton, StatusPill, Textarea } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { date, money } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Orders() {
  useTitle("Orders");
  const qc = useQueryClient();
  const [refundFor, setRefundFor] = useState(null);
  const [reason, setReason] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => get("/orders").then((r) => r.data) });
  const refund = useMutation({
    mutationFn: () => post(`/orders/${refundFor._id}/refund`, { reason }),
    onSuccess: (r) => {
      toast.success(r.message);
      setRefundFor(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const refundable = (o) =>
    o.status === "paid" && o.gateway !== "free" && Date.now() - new Date(o.paidAt) < REFUND_WINDOW_DAYS * 864e5;

  return (
    <>
      <PageHeader title="Orders & invoices" description={`Download GST invoices or request a refund within ${REFUND_WINDOW_DAYS} days.`} />
      {isLoading ? <Skeleton className="h-48" /> : (
        <DataTable
          rows={data}
          empty="You have not bought anything yet."
          columns={[
            { key: "invoice", label: "Order", render: (o) => <span className="font-mono">{o.invoiceNo || o._id.slice(-8)}</span> },
            { key: "date", label: "Date", render: (o) => date(o.paidAt || o.createdAt) },
            { key: "items", label: "Courses", render: (o) => <span className="block max-w-[260px] truncate">{o.items.map((i) => i.title).join(", ")}</span> },
            { key: "total", label: "Amount", render: (o) => money(o.total) },
            { key: "method", label: "Method", render: (o) => <span className="capitalize">{o.method || o.gateway}</span> },
            { key: "status", label: "Status", render: (o) => <StatusPill status={o.status} /> },
            {
              key: "act",
              label: "",
              render: (o) => (
                <div className="flex justify-end gap-3">
                  {o.status !== "failed" && <Link to={`/orders/${o._id}`} className="font-semibold text-primary">Invoice</Link>}
                  {refundable(o) && <button className="cursor-pointer font-semibold text-muted-foreground hover:text-destructive" onClick={() => setRefundFor(o)}>Request refund</button>}
                </div>
              ),
            },
          ]}
        />
      )}
      <Modal
        open={Boolean(refundFor)}
        onOpenChange={(o) => !o && setRefundFor(null)}
        title="Request a refund"
        description={refundFor && `${money(refundFor.total)} for ${refundFor.items.map((i) => i.title).join(", ")}. Access ends once the refund is approved.`}
        footer={<><Button variant="outline" onClick={() => setRefundFor(null)}>Cancel</Button><Button variant="destructive" disabled={reason.trim().length < 5 || refund.isPending} onClick={() => refund.mutate()}>Request refund</Button></>}
      >
        <Field label="Why are you asking for a refund?" htmlFor="refund-reason" hint="At least 5 characters. This helps the instructor improve.">
          <Textarea id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
