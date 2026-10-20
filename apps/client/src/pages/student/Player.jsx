import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Award, HelpCircle, ListVideo, X } from "lucide-react";
import { toast } from "sonner";
import ParticleButton from "@/components/kokonut/particle-button";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import VideoPlayer from "@/components/player/VideoPlayer";
import Curriculum from "@/components/player/Curriculum";
import LessonTabs from "@/components/player/LessonTabs";
import Markdown from "@/components/shared/Markdown";
import { ThemeSwitch } from "@/components/layout/Navbar";
import { errorMessage, get, post } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

export default function Player() {
  const { courseId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const playerRef = useRef(null);
  const [showList, setShowList] = useState(false);

  const course = useQuery({ queryKey: ["player", courseId], queryFn: () => get(`/learn/${courseId}`).then((r) => r.data), retry: false });
  const flat = useMemo(() => course.data?.sections.flatMap((s) => s.lessons) || [], [course.data]);
  const lessonId =
    params.get("lesson") ||
    course.data?.lastLesson ||
    flat.find((l) => !l.completed)?._id ||
    flat[0]?._id;
  const lesson = useQuery({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () => get(`/learn/${courseId}/lessons/${lessonId}`).then((r) => r.data),
    enabled: Boolean(lessonId),
  });
  useTitle(lesson.data?.title || course.data?.course.title);

  const idx = flat.findIndex((l) => l._id === lessonId);
  const prev = flat[idx - 1];
  const next = flat[idx + 1];
  const go = (l) => {
    setParams({ lesson: l._id });
    setShowList(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "n" && next) go(next);
      if (e.key === "p" && prev) go(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const saveProgress = (body) =>
    post(`/learn/${courseId}/progress`, { lessonId, ...body }).catch(() => {});

  const markComplete = async () => {
    const res = await post(`/learn/${courseId}/progress`, { lessonId, completed: true, positionSec: playerRef.current?.currentTime() });
    qc.setQueryData(["player", courseId], (d) =>
      d && {
        ...d,
        progress: res.data.progress,
        sections: d.sections.map((s) => ({ ...s, lessons: s.lessons.map((l) => (l._id === lessonId ? { ...l, completed: true } : l)) })),
      }
    );
    qc.invalidateQueries({ queryKey: ["my-courses"] });
    if (res.data.certificate) {
      toast.success("Course complete! Your certificate is ready.", {
        action: { label: "View", onClick: () => navigate(`/certificates/${res.data.certificate.code}`) },
        duration: 8000,
      });
    }
    return res;
  };

  if (course.isError)
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <EmptyState
          title="You do not have access to this course"
          body={errorMessage(course.error)}
          action={<Button asChild><Link to="/my-learning">Go to my learning</Link></Button>}
        />
      </div>
    );

  const L = lesson.data;
  const current = flat.find((l) => l._id === lessonId);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[320px_1fr]">
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <Link
            to={course.data ? `/courses/${course.data.course.slug}` : "/my-learning"}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back to course</span>
          </Link>
          <b className="min-w-0 flex-1 truncate text-center text-sm">{lesson.data?.title || course.data?.course.title || "Loading…"}</b>
          {course.data?.progress === 100 && (
            <Button size="sm" variant="ghost" asChild><Link to="/certificates"><Award /> <span className="hidden sm:inline">Certificate</span></Link></Button>
          )}
          <ThemeSwitch />
          <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => setShowList(true)}><ListVideo /> Lessons</Button>
          <Button size="sm" variant="outline" className="hidden sm:inline-flex" disabled={!prev} onClick={() => prev && go(prev)}>
            <ArrowLeft /> Previous
          </Button>
          <Button size="sm" disabled={!next} onClick={() => next && go(next)}>
            Next <ArrowRight />
          </Button>
        </header>

        <div className="bg-black">
          {!L ? (
            <div className="skeleton aspect-video rounded-none" />
          ) : L.type === "video" ? (
            <div className="mx-auto max-w-[1100px]">
              <VideoPlayer
                ref={playerRef}
                url={L.videoUrl}
                title={L.title}
                startAt={L.positionSec}
                onProgress={(t) => saveProgress({ positionSec: t })}
                onEnded={() => !current?.completed && markComplete().then(() => toast.success("Lesson complete"))}
              />
            </div>
          ) : L.type === "quiz" ? (
            <div className="grid aspect-video max-h-[60vh] w-full place-items-center bg-slate-900 p-6 text-center text-white">
              <div className="grid justify-items-center gap-3">
                <Badge>Quiz</Badge>
                <h2 className="text-2xl font-bold sm:text-3xl">{L.title.replace(/^Quiz · /, "")}</h2>
                <p className="opacity-70">{L.quiz.questions.length} questions · pass with {L.quiz.passScore}%</p>
                {L.bestAttempt && <p className="text-sm">Best score: <b>{L.bestAttempt.score}%</b> {L.bestAttempt.passed ? "· passed" : ""}</p>}
                <Button size="lg" asChild><Link to={`/learn/${courseId}/quiz/${L._id}`}><HelpCircle /> {L.bestAttempt ? "Retake quiz" : "Start quiz"}</Link></Button>
              </div>
            </div>
          ) : (
            <div className="bg-card">
              <div className="mx-auto max-w-3xl px-5 py-10">
                <Markdown className="prose-base sm:prose-lg">{L.content}</Markdown>
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:px-6">
          {L ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-1">
                  <span className="eyebrow">Lesson {idx + 1} of {flat.length}</span>
                  <h1 className="text-2xl font-bold">{L.title}</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={!prev} onClick={() => prev && go(prev)} title="Previous (p)"><ArrowLeft /> Previous</Button>
                  {course.data?.enrolled && L.type !== "quiz" && !current?.completed ? (
                    <ParticleButton
                      key={lessonId}
                      className="h-10 rounded-lg"
                      successLabel="Done"
                      onClick={markComplete}
                      onSuccess={() => next && setTimeout(() => go(next), 500)}
                      onError={(e) => toast.error(errorMessage(e))}
                    >
                      Mark complete {next && "& next"}
                    </ParticleButton>
                  ) : (
                    <Button disabled={!next} onClick={() => next && go(next)} title="Next (n)">Next <ArrowRight /></Button>
                  )}
                </div>
              </div>
              <LessonTabs key={lessonId} course={course.data.course} lesson={L} enrolled={course.data.enrolled} initialTab={params.get("tab")} getTime={() => playerRef.current?.currentTime() || 0} />
            </>
          ) : (
            <Skeleton className="h-40" />
          )}
        </div>
      </div>

      <aside
        className={cn(
          "fixed inset-0 z-40 bg-card lg:sticky lg:top-0 lg:z-auto lg:order-first lg:block lg:h-dvh lg:border-r lg:border-border",
          showList ? "block" : "hidden"
        )}
      >
        <Button variant="ghost" size="icon-sm" className="absolute right-3 top-3 lg:hidden" onClick={() => setShowList(false)} aria-label="Close lessons"><X /></Button>
        {course.data ? <Curriculum data={course.data} currentId={lessonId} onSelect={go} /> : <Skeleton className="m-4 h-96" />}
      </aside>
    </div>
  );
}
