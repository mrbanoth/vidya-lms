import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Button, EmptyState, PageHeader, Progress, Skeleton, Tabs } from "@/components/ui";
import CourseThumb from "@/components/course/CourseThumb";
import { get } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function MyLearning() {
  useTitle("My learning");
  const [tab, setTab] = useState("progress");
  const { data = [], isLoading } = useQuery({ queryKey: ["my-courses"], queryFn: () => get("/learn/my-courses").then((r) => r.data) });
  const groups = { progress: data.filter((e) => e.progress < 100), done: data.filter((e) => e.progress === 100), all: data };
  const list = groups[tab];
  return (
    <>
      <PageHeader title="My learning" description="Every course you own, with your progress." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "progress", label: "In progress", count: groups.progress.length },
          { value: "done", label: "Completed", count: groups.done.length },
          { value: "all", label: "All", count: data.length },
        ]}
      />
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon={BookOpen} title={tab === "done" ? "No finished courses yet" : "No courses here"} body="Courses you enroll in appear here." action={<Button size="sm" asChild><Link to="/courses">Browse courses</Link></Button>} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-4">
          {list.map((e) => (
            <article key={e.id} className="relative grid overflow-hidden rounded-2xl border border-border bg-card">
              <CourseThumb course={e.course}>
                <span className="absolute left-2.5 top-2.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-white">
                  {e.progress === 100 ? "Completed" : `${e.progress}% done`}
                </span>
              </CourseThumb>
              <div className="grid gap-2 p-4">
                <h3 className="line-clamp-2 font-sans text-[15px] font-bold">
                  <Link to={`/learn/${e.course._id}`} className="after:absolute after:inset-0">{e.course.title}</Link>
                </h3>
                <span className="text-xs text-muted-foreground">{e.course.instructor?.name} · active {timeAgo(e.lastActiveAt)}</span>
                <Progress value={e.progress} />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{e.progress}% complete</span>
                  <span className="font-semibold text-primary">{e.progress === 100 ? "Review" : "Resume"} →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
