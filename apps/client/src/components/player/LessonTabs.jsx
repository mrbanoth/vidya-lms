import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ExternalLink, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Stars, Tabs, Textarea } from "@/components/ui";
import Markdown from "@/components/shared/Markdown";
import { assetUrl, del, errorMessage, get, post, put } from "@/lib/api";
import { clock, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function Notes({ courseId, lesson, getTime }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const key = ["notes", courseId];
  const { data = [] } = useQuery({ queryKey: key, queryFn: () => get(`/learn/${courseId}/notes`).then((r) => r.data) });
  const add = useMutation({
    mutationFn: () => post(`/learn/${courseId}/notes`, { lessonId: lesson._id, timeSec: Math.floor(getTime()), body }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: key }); toast.success("Note saved"); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({ mutationFn: (id) => del(`/learn/${courseId}/notes/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
  const here = data.filter((n) => n.lesson?._id === lesson._id);
  const other = data.filter((n) => n.lesson?._id !== lesson._id);
  return (
    <div className="grid gap-4">
      <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); body.trim() && add.mutate(); }}>
        <Field label={`New note${lesson.type === "video" ? ` at ${clock(getTime())}` : ""}`} htmlFor="note-body">
          <Textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a note for this lesson" rows={3} />
        </Field>
        <Button type="submit" size="sm" className="justify-self-start" disabled={!body.trim() || add.isPending}>Save note</Button>
      </form>
      {[["This lesson", here], ["Other lessons", other]].map(([title, list]) =>
        list.length ? (
          <div key={title} className="grid gap-2">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</h3>
            {list.map((n) => (
              <Card key={n._id} className="flex gap-3 p-3.5">
                <Badge tone="grey">{clock(n.timeSec)}</Badge>
                <div className="min-w-0 flex-1 text-sm">
                  {title === "Other lessons" && <span className="block text-xs text-muted-foreground">{n.lesson?.title}</span>}
                  <p className="whitespace-pre-wrap">{n.body}</p>
                </div>
                <button className="cursor-pointer text-muted-foreground hover:text-destructive" aria-label="Delete note" onClick={() => remove.mutate(n._id)}><Trash2 className="size-4" /></button>
              </Card>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}

function QA({ courseId, lesson }) {
  const qc = useQueryClient();
  const [scope, setScope] = useState("lesson");
  const [asking, setAsking] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState({});
  const params = scope === "lesson" ? { lessonId: lesson._id } : {};
  const key = ["questions", courseId, scope, lesson._id];
  const { data = [] } = useQuery({ queryKey: key, queryFn: () => get(`/learn/${courseId}/questions`, params).then((r) => r.data) });
  const ask = useMutation({
    mutationFn: () => post(`/learn/${courseId}/questions`, { lessonId: lesson._id, title, body }),
    onSuccess: () => { setTitle(""); setBody(""); setAsking(false); qc.invalidateQueries({ queryKey: ["questions", courseId] }); toast.success("Question posted. The instructor was notified."); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const answer = useMutation({
    mutationFn: ({ id, text }) => post(`/learn/questions/${id}/answers`, { body: text }),
    onSuccess: (_r, { id }) => { setReply((r) => ({ ...r, [id]: "" })); qc.invalidateQueries({ queryKey: ["questions", courseId] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 text-sm">
          {[["lesson", "This lesson"], ["all", "All questions"]].map(([v, l]) => (
            <button key={v} onClick={() => setScope(v)} className={cn("cursor-pointer rounded-full px-3 py-1 font-semibold", scope === v ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>{l}</button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setAsking((a) => !a)}><MessageSquarePlus /> Ask a question</Button>
      </div>
      {asking && (
        <Card as="form" className="grid gap-3" onSubmit={(e) => { e.preventDefault(); ask.mutate(); }}>
          <Field label="Question" htmlFor="q-title"><Input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your question" /></Field>
          <Field label="Details (optional)" htmlFor="q-body"><Textarea id="q-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="What did you try? Paste the error." /></Field>
          <Button size="sm" type="submit" className="justify-self-start" disabled={title.trim().length < 5 || ask.isPending}>Post question</Button>
        </Card>
      )}
      {data.length === 0 && !asking && <EmptyState title="No questions yet" body="Stuck on something? Ask and the instructor will answer here." />}
      {data.map((q) => (
        <Card key={q._id} className="grid gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={q.user?.name} src={q.user?.avatar} size={32} />
            <div className="min-w-0 flex-1"><b className="block text-sm">{q.user?.name}</b><span className="text-xs text-muted-foreground">{scope === "all" && q.lesson ? `${q.lesson.title} · ` : ""}{timeAgo(q.createdAt)}</span></div>
            {q.answered && <Badge>Answered</Badge>}
          </div>
          <div><b>{q.title}</b>{q.body && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{q.body}</p>}</div>
          {q.answers.map((a) => (
            <div key={a._id} className={cn("grid gap-2 rounded-xl p-3", a.isInstructor ? "bg-accent/60" : "bg-muted")}>
              <div className="flex items-center gap-2 text-sm">
                <Avatar name={a.user?.name} src={a.user?.avatar} size={24} />
                <b>{a.user?.name}</b>
                {a.isInstructor && <Badge tone="ink">Instructor</Badge>}
                <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
              </div>
              <Markdown className="prose-p:my-1">{a.body}</Markdown>
            </div>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); reply[q._id]?.trim() && answer.mutate({ id: q._id, text: reply[q._id] }); }}>
            <label htmlFor={`r-${q._id}`} className="sr-only">Reply</label>
            <Input id={`r-${q._id}`} value={reply[q._id] || ""} onChange={(e) => setReply((r) => ({ ...r, [q._id]: e.target.value }))} placeholder="Write a reply" />
            <Button type="submit" variant="outline" disabled={!reply[q._id]?.trim()}>Reply</Button>
          </form>
        </Card>
      ))}
    </div>
  );
}

function Review({ courseId }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-review", courseId], queryFn: () => get(`/learn/${courseId}/review`).then((r) => r.data) });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const save = useMutation({
    mutationFn: () => put(`/learn/${courseId}/review`, { rating, comment }),
    onSuccess: (r) => { toast.success(r.message); setEditing(false); qc.invalidateQueries({ queryKey: ["my-review", courseId] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (data && !editing)
    return (
      <Card className="grid gap-2">
        <span className="text-sm text-muted-foreground">Your review</span>
        <Stars value={data.rating} size={18} />
        {data.comment && <p>{data.comment}</p>}
        <Button size="sm" variant="outline" className="justify-self-start" onClick={() => { setRating(data.rating); setComment(data.comment); setEditing(true); }}>Edit review</Button>
      </Card>
    );
  return (
    <Card as="form" className="grid gap-3" onSubmit={(e) => { e.preventDefault(); rating && save.mutate(); }}>
      <b>How would you rate this course?</b>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star`} onClick={() => setRating(n)} className={cn("cursor-pointer text-3xl transition", n <= rating ? "text-warning" : "text-border hover:text-warning/60")}>★</button>
        ))}
      </div>
      <Field label="Tell other learners what you think (optional)" htmlFor="rv-comment"><Textarea id="rv-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} /></Field>
      <Button size="sm" type="submit" className="justify-self-start" disabled={!rating || save.isPending}>Submit review</Button>
    </Card>
  );
}

export default function LessonTabs({ course, lesson, getTime, enrolled, initialTab }) {
  const [tab, setTab] = useState(initialTab || "overview");
  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "notes", label: "Notes" },
    { value: "qa", label: "Q&A" },
    { value: "resources", label: "Resources", count: lesson.resources?.length || undefined },
    ...(enrolled ? [{ value: "review", label: "Review" }] : []),
  ];
  return (
    <div className="grid gap-5">
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === "overview" && (
        <div className="grid gap-4">
          {lesson.type === "article" ? <Markdown className="prose-base">{lesson.content}</Markdown> : <p className="text-muted-foreground">{lesson.content || `This lesson is part of ${course.title}. Use Notes to save timestamps and Q&A to ask the instructor.`}</p>}
          <Link to={`/instructors/${course.instructor._id}`} className="flex items-center gap-3 justify-self-start">
            <Avatar name={course.instructor.name} src={course.instructor.avatar} size={36} />
            <span className="grid text-sm"><b>{course.instructor.name}</b><span className="text-muted-foreground">{course.instructor.headline}</span></span>
          </Link>
        </div>
      )}
      {tab === "notes" && <Notes courseId={course._id} lesson={lesson} getTime={getTime} />}
      {tab === "qa" && <QA courseId={course._id} lesson={lesson} />}
      {tab === "resources" && (
        lesson.resources?.length ? (
          <div className="grid gap-2">
            {lesson.resources.map((r) => (
              <a key={r.url} href={assetUrl(r.url)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary">
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">{r.url.startsWith("/uploads") ? <Download className="size-4" /> : <ExternalLink className="size-4" />}</span>
                <span className="font-semibold">{r.name}</span>
              </a>
            ))}
          </div>
        ) : <EmptyState title="No resources for this lesson" />
      )}
      {tab === "review" && <Review courseId={course._id} />}
    </div>
  );
}
