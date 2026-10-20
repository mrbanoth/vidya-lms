import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Copy, Lock } from "lucide-react";
import { copyVerifyLink } from "@/features/certificates/copyVerifyLink";
import CardFlip from "@/components/kokonut/card-flip";
import { Button, EmptyState, PageHeader, Progress, Skeleton } from "@/components/ui";
import { apiUrl, get } from "@/lib/api";
import { date } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Certificates() {
  useTitle("Certificates");
  const certs = useQuery({ queryKey: ["certs"], queryFn: () => get("/certificates/mine").then((r) => r.data) });
  const courses = useQuery({ queryKey: ["my-courses"], queryFn: () => get("/learn/my-courses").then((r) => r.data) });
  const locked = (courses.data || []).filter((e) => e.progress < 100);
  return (
    <>
      <PageHeader title="Certificates" description="Flip a card to see its details. Every certificate has a public verify link." />
      {certs.isLoading ? (
        <Skeleton className="h-56" />
      ) : certs.data.length === 0 && locked.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" body="Finish every lesson in a course to earn one." action={<Button size="sm" asChild><Link to="/courses">Find a course</Link></Button>} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
          {certs.data.map((c) => (
            <div key={c._id} className="grid gap-3">
              <CardFlip
                className="h-52 w-full max-w-none"
                label={`Certificate for ${c.courseTitle}`}
                front={
                  <div className="relative grid h-full content-center justify-items-center gap-1.5 rounded-2xl border border-border bg-card p-5 text-center">
                    <span className="pointer-events-none absolute inset-2 rounded-xl border border-primary/40" />
                    <span className="eyebrow">Certificate</span>
                    <b className="font-display text-lg leading-tight">{c.courseTitle}</b>
                    <span className="text-sm text-muted-foreground">{c.userName}</span>
                  </div>
                }
                back={
                  <div className="grid h-full content-center gap-2 rounded-2xl bg-ink p-5 text-sm text-ink-foreground">
                    <span className="font-mono text-xs opacity-70">{c.code}</span>
                    <span>Issued {date(c.issuedAt)}</span>
                    <span>Instructor: {c.instructorName}</span>
                    <span>{c.hours} hours of content</span>
                  </div>
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild><Link to={`/certificates/${c.code}`}>View</Link></Button>
                <Button size="sm" variant="outline" asChild><a href={apiUrl(`/certificates/${c.code}/pdf`)} target="_blank" rel="noreferrer">PDF</a></Button>
                <Button size="sm" variant="ghost" onClick={() => copyVerifyLink(c.code)}><Copy /> Copy link</Button>
              </div>
            </div>
          ))}
          {locked.map((e) => (
            <div key={e.id} className="grid h-52 content-center gap-3 rounded-2xl border border-dashed border-border p-5">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"><Lock className="size-3.5" /> Locked</span>
              <b className="line-clamp-2">{e.course.title}</b>
              <Progress value={e.progress} />
              <span className="text-xs text-muted-foreground">{e.progress}% done. Finish the course to unlock.</span>
              <Button size="sm" variant="outline" className="justify-self-start" asChild><Link to={`/learn/${e.course._id}`}>Continue</Link></Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
