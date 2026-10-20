import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Check, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { clock } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

export default function Quiz() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: lesson, isLoading } = useQuery({ queryKey: ["lesson", courseId, lessonId], queryFn: () => get(`/learn/${courseId}/lessons/${lessonId}`).then((r) => r.data) });
  useTitle(lesson?.title);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(null);

  const questions = lesson?.quiz.questions || [];
  useEffect(() => {
    if (questions.length && left === null) setLeft(questions.length * 90);
  }, [questions.length, left]);
  useEffect(() => {
    if (left === null || result) return;
    if (left <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  });

  async function submit() {
    setBusy(true);
    try {
      const res = await post(`/learn/${courseId}/lessons/${lessonId}/quiz`, { answers: questions.map((_, k) => answers[k] ?? -1) });
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ["player", courseId] });
      qc.invalidateQueries({ queryKey: ["lesson", courseId, lessonId] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const back = `/learn/${courseId}?lesson=${lessonId}`;
  if (isLoading) return <div className="container-page max-w-2xl py-16"><Skeleton className="h-80" /></div>;

  if (result)
    return (
      <div className="container-page grid max-w-2xl gap-5 py-12">
        <Card className="grid justify-items-center gap-3 p-8 text-center">
          <Badge tone={result.passed ? "default" : "amber"} mono={false} className="rounded-full px-3">{result.passed ? "Passed" : "Not passed yet"}</Badge>
          <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("font-display text-7xl font-extrabold", result.passed ? "text-primary" : "text-warning")}>
            {result.correct}/{result.total}
          </motion.span>
          <p className="text-muted-foreground">
            {result.passed ? `Score ${result.score}%. The lesson is marked complete.` : `Score ${result.score}%. You need ${result.passScore}% to pass. Review the explanations and try again.`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => { setResult(null); setAnswers([]); setI(0); setLeft(questions.length * 90); }}>Retake quiz</Button>
            <Button onClick={() => navigate(back)}>Back to course</Button>
          </div>
        </Card>
        {result.review.map((q, k) => {
          const ok = q.chosen === q.answer;
          return (
            <Card key={k} className="grid gap-3">
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white", ok ? "bg-primary" : "bg-destructive")}>{ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}</span>
                <b>{q.text}</b>
              </div>
              <ul className="grid gap-1.5 pl-9 text-sm">
                {q.options.map((o, n) => (
                  <li key={n} className={cn("rounded-lg px-3 py-1.5", n === q.answer && "bg-accent font-semibold text-accent-foreground", n === q.chosen && n !== q.answer && "bg-destructive/10 text-destructive line-through")}>{o}</li>
                ))}
              </ul>
              {q.explanation && <p className="pl-9 text-sm text-muted-foreground">{q.explanation}</p>}
            </Card>
          );
        })}
      </div>
    );

  const q = questions[i];
  return (
    <div className="container-page grid max-w-2xl gap-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <Link to={back} className="text-sm font-semibold text-primary">← Exit quiz</Link>
        <span className={cn("flex items-center gap-1.5 font-mono text-sm", left < 30 && "text-destructive")}><Timer className="size-4" /> {clock(left || 0)}</span>
      </div>
      <div className="grid gap-2">
        <span className="eyebrow">{lesson.title}</span>
        <div className="flex gap-1.5" aria-hidden>
          {questions.map((_, k) => <span key={k} className={cn("h-1.5 flex-1 rounded-full", k < i ? "bg-primary" : k === i ? "bg-primary/60" : "bg-border")} />)}
        </div>
        <span className="text-xs text-muted-foreground">Question {i + 1} of {questions.length}</span>
      </div>
      <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="grid gap-5">
        <h1 className="text-2xl font-bold">{q.text}</h1>
        <div className="grid gap-2.5" role="radiogroup" aria-label="Answers">
          {q.options.map((o, n) => (
            <button
              key={n}
              role="radio"
              aria-checked={answers[i] === n}
              onClick={() => setAnswers((a) => { const c = [...a]; c[i] = n; return c; })}
              className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-card p-4 text-left transition", answers[i] === n ? "border-primary bg-accent" : "border-border hover:border-primary/50")}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted font-mono text-xs font-semibold">{"ABCDEF"[n]}</span>
              {o}
            </button>
          ))}
        </div>
      </motion.div>
      <div className="flex justify-between">
        <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button>
        {i < questions.length - 1 ? (
          <Button disabled={answers[i] === undefined} onClick={() => setI(i + 1)}>Next question</Button>
        ) : (
          <Button disabled={answers[i] === undefined || busy} onClick={submit}>{busy && <Spinner />} Submit answers</Button>
        )}
      </div>
    </div>
  );
}
