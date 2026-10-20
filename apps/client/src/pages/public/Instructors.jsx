import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Search } from "lucide-react";
import { Avatar, EmptyState, Input, Skeleton, Stars } from "@/components/ui";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Instructors() {
  useTitle("Instructors");
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["instructors"], queryFn: () => get("/instructors").then((r) => r.data), staleTime: 300_000 });
  const list = data.filter((u) => `${u.name} ${u.headline || ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="container-page grid gap-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid max-w-2xl gap-2">
          <span className="eyebrow">Instructors</span>
          <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-extrabold">Learn from people who build</h1>
          <p className="text-muted-foreground">Every instructor teaches from real projects, and every course is reviewed before it goes live.</p>
        </div>
        <label className="relative w-full max-w-xs">
          <span className="sr-only">Search instructors</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search instructors" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon={GraduationCap} title={q ? "No instructors match" : "No instructors yet"} body={q ? "Try a different name or topic." : "Instructors appear here once their first course is published."} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((u) => (
            <li key={u._id}>
              <Link to={`/instructors/${u._id}`} className="grid h-full justify-items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/40">
                <Avatar name={u.name} src={u.avatar} size={72} />
                <div className="grid gap-0.5">
                  <b className="text-base">{u.name}</b>
                  <span className="line-clamp-2 text-sm text-muted-foreground">{u.headline || "Instructor"}</span>
                </div>
                {u.stats.reviews > 0 && (
                  <span className="flex items-center gap-1.5 text-sm"><b className="text-warning">{u.stats.rating.toFixed(1)}</b><Stars value={u.stats.rating} /><span className="text-muted-foreground">({compact(u.stats.reviews)})</span></span>
                )}
                <div className="mt-auto flex w-full justify-center gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span><b className="block text-sm text-foreground">{u.stats.courses}</b>Courses</span>
                  <span><b className="block text-sm text-foreground">{compact(u.stats.students)}</b>Students</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
