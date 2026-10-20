import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, DataTable, PageHeader, Skeleton, StatusPill } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { date, money } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Payouts() {
  useTitle("Payouts");
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-payouts"], queryFn: () => get("/admin/payouts").then((r) => r.data) });
  const decide = useMutation({
    mutationFn: ({ id, decision }) => post(`/admin/payouts/${id}`, { decision }),
    onSuccess: () => { toast.success("Payout updated"); qc.invalidateQueries({ queryKey: ["admin-payouts"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <PageHeader title="Instructor payouts" description="Approve withdrawal requests after the transfer is sent." />
      {isLoading ? <Skeleton className="h-64" /> : (
        <DataTable
          rows={data}
          empty="No payout requests."
          columns={[
            { key: "ins", label: "Instructor", render: (p) => <div><b className="block">{p.instructor?.name}</b><span className="text-xs text-muted-foreground">{p.instructor?.email}</span></div> },
            { key: "amount", label: "Amount", render: (p) => money(p.amount) },
            { key: "net", label: "After TDS", render: (p) => money(p.amount - p.tds) },
            { key: "to", label: "UPI", render: (p) => <span className="font-mono text-xs">{p.destination}</span> },
            { key: "date", label: "Requested", render: (p) => date(p.createdAt) },
            { key: "status", label: "Status", render: (p) => <StatusPill status={p.status} /> },
            {
              key: "act",
              label: "",
              render: (p) => p.status === "requested" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decide.mutate({ id: p._id, decision: "approve" })}>Mark paid</Button>
                  <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: p._id, decision: "reject" })}>Decline</Button>
                </div>
              ),
            },
          ]}
        />
      )}
    </>
  );
}
