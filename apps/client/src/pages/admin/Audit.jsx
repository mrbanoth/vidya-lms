import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, DataTable, Input, PageHeader, Pagination, Select, Skeleton } from "@/components/ui";
import { get } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import { useTitle } from "@/hooks/useTitle";

const tone = (a) => (/ban|reject|delete|refund/.test(a) ? "red" : /approve|create|paid/.test(a) ? "default" : /update|role/.test(a) ? "amber" : "grey");

export default function Audit() {
  useTitle("Audit log");
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const { data, isLoading } = useQuery({ queryKey: ["audit", dq, action, page], queryFn: () => get("/admin/audit", { q: dq, action, page }) });
  return (
    <>
      <PageHeader title="Audit log" description="Every admin action, who did it and when." />
      <div className="flex flex-wrap gap-3">
        <Input aria-label="Filter" placeholder="Filter by person, action or target" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
        <Select aria-label="Action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="w-auto">
          <option value="all">All actions</option>
          {data?.meta.actions.map((a) => <option key={a}>{a}</option>)}
        </Select>
      </div>
      {isLoading ? <Skeleton className="h-96" /> : (
        <>
          <DataTable
            rows={data.data}
            empty="No matching entries."
            columns={[
              { key: "time", label: "Time", render: (a) => dateTime(a.createdAt) },
              { key: "actor", label: "Actor", render: (a) => <b>{a.actorName}</b> },
              { key: "action", label: "Action", render: (a) => <Badge tone={tone(a.action)}>{a.action}</Badge> },
              { key: "target", label: "Target", render: (a) => <span className="block max-w-[280px] truncate">{a.targetLabel || a.targetType}</span> },
              { key: "ip", label: "IP", render: (a) => <span className="text-xs text-muted-foreground">{a.ip || "—"}</span> },
            ]}
          />
          <Pagination page={page} pages={data.meta.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
