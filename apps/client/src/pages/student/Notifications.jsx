import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { Button, Chip, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { useNotifications } from "@/features/notifications/useNotifications";
import { timeAgo } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

const FILTERS = [["all", "All"], ["unread", "Unread"], ["qa", "Q&A"], ["billing", "Billing"], ["course", "Courses"], ["certificate", "Certificates"]];

export default function Notifications() {
  useTitle("Notifications");
  const [filter, setFilter] = useState("all");
  const params = filter === "unread" ? { unread: true } : filter === "all" ? {} : { type: filter };
  const { items, unread, isLoading, readAll, readOne } = useNotifications(params);
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Notifications" description={unread ? `${unread} unread` : "You are all caught up."} actions={unread > 0 && <Button variant="outline" size="sm" onClick={() => readAll.mutate()}>Mark all as read</Button>} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([v, l]) => <Chip key={v} active={filter === v} onClick={() => setFilter(v)}>{l}</Chip>)}
      </div>
      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState icon={Bell} title="Nothing here" body="Replies, purchases and certificates show up here." />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-card">
          {items.map((n) => (
            <li key={n._id}>
              <button
                onClick={() => { if (!n.read) readOne.mutate(n._id); if (n.link) navigate(n.link); }}
                className={cn("flex w-full cursor-pointer items-start gap-3 border-b border-border px-5 py-4 text-left last:border-0 hover:bg-muted", !n.read && "bg-accent/40")}
              >
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <b className="text-sm">{n.title}</b>
                  {n.body && <span className="text-sm text-muted-foreground">{n.body}</span>}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
