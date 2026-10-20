import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckSquare, ExternalLink, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Button, Card, Chip, EmptyState, Field, Modal, PageHeader, Skeleton, StatusPill, Textarea } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { date, duration, inr } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function CourseReview() {
  useTitle("Course review");
  const qc = useQueryClient();
  const [status, setStatus] = useState("review");
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-courses", status], queryFn: () => get("/admin/courses", { status }).then((r) => r.data) });
  const decide = useMutation({
    mutationFn: ({ id, decision, reason }) => post(`/admin/courses/${id}/decision`, { decision, reason }),
    onSuccess: (r) => { toast.success(r.message); setRejecting(null); setReason(""); qc.invalidateQueries({ queryKey: ["admin-courses"] }); qc.invalidateQueries({ queryKey: ["admin-overview"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const bestseller = useMutation({ mutationFn: (id) => post(`/admin/courses/${id}/bestseller`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }) });
  return (
    <>
      <PageHeader title="Course review" description="Check quality, pricing and content policy before a course goes live." />
      <div className="flex flex-wrap gap-2">{[["review", "Waiting"], ["published", "Published"], ["rejected", "Changes requested"]].map(([v, l]) => <Chip key={v} active={status === v} onClick={() => setStatus(v)}>{l}</Chip>)}</div>
      {isLoading ? <Skeleton className="h-80" /> : data.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Queue is clear" body="New submissions show up here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((c) => (
            <Card key={c._id} className="grid content-start gap-4">
              <div className="flex items-center justify-between gap-2"><StatusPill status={c.status} /><span className="font-mono text-xs text-muted-foreground">{c.submittedAt ? `Submitted ${date(c.submittedAt)}` : ""}</span></div>
              <div className="grid gap-1"><h2 className="text-lg font-bold">{c.title}</h2><p className="text-sm text-muted-foreground">{c.subtitle}</p></div>
              <div className="flex items-center gap-3 text-sm"><Avatar name={c.instructor.name} src={c.instructor.avatar} size={30} /><span><b>{c.instructor.name}</b> · {c.category?.name} · {c.totalLessons} lessons · {duration(c.totalDuration)} · {inr(c.discountPrice ?? c.price)}</span></div>
              <ul className="grid gap-1.5 text-sm">
                {c.checklist.map((i) => <li key={i.key} className="flex items-center gap-2">{i.done ? <Check className="size-4 text-primary" /> : <X className="size-4 text-destructive" />}{i.label}</li>)}
              </ul>
              {c.reviewNote && <p className="rounded-lg bg-muted p-3 text-sm"><b>Note:</b> {c.reviewNote}</p>}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild><Link to={`/courses/${c.slug}`} target="_blank"><ExternalLink /> Preview</Link></Button>
                {c.status !== "published" && <Button size="sm" onClick={() => decide.mutate({ id: c._id, decision: "approve" })}>Approve & publish</Button>}
                {c.status !== "rejected" && <Button size="sm" variant="destructive-soft" onClick={() => setRejecting(c)}>{c.status === "published" ? "Unpublish" : "Request changes"}</Button>}
                {c.status === "published" && <Button size="sm" variant="ghost" onClick={() => bestseller.mutate(c._id)}><Star className={c.bestseller ? "fill-current text-warning" : ""} /> {c.bestseller ? "Bestseller" : "Mark bestseller"}</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal
        open={Boolean(rejecting)}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Request changes"
        description={`Tell ${rejecting?.instructor.name} what to fix in “${rejecting?.title}”. They get an email and a notification.`}
        footer={<><Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="destructive" disabled={reason.trim().length < 5 || decide.isPending} onClick={() => decide.mutate({ id: rejecting._id, decision: "reject", reason })}>Send to instructor</Button></>}
      >
        <Field label="What needs to change?" htmlFor="rej-reason"><Textarea id="rej-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Audio in section 2 is too quiet. Add a thumbnail." /></Field>
      </Modal>
    </>
  );
}
