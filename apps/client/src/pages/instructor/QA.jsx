import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Button, Card, Chip, EmptyState, Field, PageHeader, Skeleton, Textarea } from "@/components/ui";
import Markdown from "@/components/shared/Markdown";
import { errorMessage, get, post } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

export default function QA() {
  useTitle("Q&A inbox");
  const qc = useQueryClient();
  const [status, setStatus] = useState("open");
  const [activeId, setActiveId] = useState(null);
  const [reply, setReply] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["instructor-qa", status], queryFn: () => get("/instructor/questions", { status }).then((r) => r.data) });
  const active = data.find((q) => q._id === activeId) || data[0];
  const answer = useMutation({
    mutationFn: () => post(`/learn/questions/${active._id}/answers`, { body: reply }),
    onSuccess: () => { toast.success("Answer posted. The learner was notified."); setReply(""); qc.invalidateQueries({ queryKey: ["instructor-qa"] }); qc.invalidateQueries({ queryKey: ["instructor-dashboard"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <PageHeader title="Q&A inbox" description="Questions learners asked inside your lessons." />
      <div className="flex gap-2">{[["open", "Unanswered"], ["answered", "Answered"], ["all", "All"]].map(([v, l]) => <Chip key={v} active={status === v} onClick={() => { setStatus(v); setActiveId(null); }}>{l}</Chip>)}</div>
      {isLoading ? <Skeleton className="h-80" /> : data.length === 0 ? (
        <EmptyState icon={MessageSquare} title={status === "open" ? "No unanswered questions" : "No questions yet"} body="New questions show up here and in your notifications." />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
          <ul className="overflow-hidden rounded-xl border border-border bg-card">
            {data.map((q) => (
              <li key={q._id}>
                <button onClick={() => setActiveId(q._id)} className={cn("grid w-full cursor-pointer gap-1.5 border-b border-border p-4 text-left last:border-0 hover:bg-muted", active?._id === q._id && "bg-accent/60")}>
                  <div className="flex items-center gap-2"><Avatar name={q.user?.name} src={q.user?.avatar} size={24} /><span className="text-xs text-muted-foreground">{q.user?.name} · {timeAgo(q.createdAt)}</span></div>
                  <b className="text-sm">{q.title}</b>
                  <span className="truncate text-xs text-muted-foreground">{q.course?.title}{q.lesson ? ` · ${q.lesson.title}` : ""}</span>
                  {q.answered ? <Badge className="justify-self-start">Answered</Badge> : <Badge tone="amber" className="justify-self-start">Unanswered</Badge>}
                </button>
              </li>
            ))}
          </ul>
          {active && (
            <Card className="grid gap-4 p-6">
              <div className="flex items-center gap-3"><Avatar name={active.user?.name} src={active.user?.avatar} size={36} /><div><b className="block text-sm">{active.user?.name}</b><span className="text-xs text-muted-foreground">{active.course?.title}{active.lesson ? ` · ${active.lesson.title}` : ""}</span></div></div>
              <h2 className="text-xl font-bold">{active.title}</h2>
              {active.body && <p className="whitespace-pre-wrap text-muted-foreground">{active.body}</p>}
              {active.answers.map((a) => (
                <div key={a._id} className={cn("grid gap-2 rounded-xl p-3", a.isInstructor ? "bg-accent/60" : "bg-muted")}>
                  <span className="text-xs font-semibold">{a.user?.name}{a.isInstructor && " · Instructor"} · {timeAgo(a.createdAt)}</span>
                  <Markdown>{a.body}</Markdown>
                </div>
              ))}
              <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); reply.trim().length >= 2 && answer.mutate(); }}>
                <Field label="Your answer" htmlFor="qa-reply" hint="Markdown and code blocks work."><Textarea id="qa-reply" rows={5} value={reply} onChange={(e) => setReply(e.target.value)} /></Field>
                <Button type="submit" className="justify-self-start" disabled={reply.trim().length < 2 || answer.isPending}>Post answer</Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
