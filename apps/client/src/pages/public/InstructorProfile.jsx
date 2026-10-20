import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Github, Globe, Linkedin } from "lucide-react";
import { Avatar, Card, Skeleton } from "@/components/ui";
import { CourseGrid } from "@/components/course/CourseCard";
import Markdown from "@/components/shared/Markdown";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import NotFound from "./NotFound";

export default function InstructorProfile() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({ queryKey: ["instructor", id], queryFn: () => get(`/instructors/${id}`).then((r) => r.data) });
  useTitle(data?.name);
  if (isError) return <NotFound />;
  if (isLoading) return <div className="container-page py-10"><Skeleton className="h-48" /></div>;
  const links = [
    data.website && [Globe, data.website, data.website],
    data.github && [Github, `https://github.com/${data.github}`, `github.com/${data.github}`],
    data.linkedin && [Linkedin, `https://linkedin.com/in/${data.linkedin}`, `linkedin.com/in/${data.linkedin}`],
  ].filter(Boolean);
  return (
    <div className="container-page grid gap-10 py-10">
      <Card className="grid items-center gap-6 p-7 sm:grid-cols-[auto_1fr]">
        <Avatar name={data.name} src={data.avatar} size={104} />
        <div className="grid gap-3">
          <span className="eyebrow">Instructor</span>
          <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold">{data.name}</h1>
          <p className="text-muted-foreground">{data.headline}</p>
          <div className="flex flex-wrap gap-8">
            {[[compact(data.stats.students), "learners"], [data.stats.rating || "–", "average rating"], [compact(data.stats.reviews), "reviews"], [data.stats.courses, "courses"]].map(([v, l]) => (
              <div key={l}><b className="tabular block font-display text-2xl font-extrabold">{v}</b><span className="text-xs text-muted-foreground">{l}</span></div>
            ))}
          </div>
        </div>
      </Card>
      {(data.bio || links.length > 0) && (
        <Card className="grid gap-4">
          <h2 className="text-xl font-bold">About</h2>
          {data.bio && <Markdown>{data.bio}</Markdown>}
          <div className="flex flex-wrap gap-2">
            {links.map(([Icon, href, label]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs hover:text-primary">
                <Icon className="size-3.5" /> {label}
              </a>
            ))}
          </div>
        </Card>
      )}
      <section className="grid gap-5">
        <h2 className="text-2xl font-bold">Courses by {data.name.split(" ")[0]} ({data.courses.length})</h2>
        <CourseGrid courses={data.courses} />
      </section>
    </div>
  );
}
