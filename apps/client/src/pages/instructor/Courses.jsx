import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { BookPlus, Plus } from "lucide-react";
import { Button, DataTable, EmptyState, Input, PageHeader, Select, Skeleton, StatusPill } from "@/components/ui";
import { get } from "@/lib/api";
import { glyph, inr, num } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function InstructorCourses() {
  useTitle("My courses");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const { data = [], isLoading } = useQuery({ queryKey: ["instructor-courses"], queryFn: () => get("/instructor/courses").then((r) => r.data) });
  const rows = data.filter((c) => (status === "all" || c.status === status) && c.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="My courses" actions={<Button asChild><Link to="/studio/courses/new"><Plus /> New course</Link></Button>} />
      <div className="flex flex-wrap gap-3">
        <Input aria-label="Search your courses" placeholder="Search your courses" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="all">All statuses</option><option value="published">Published</option><option value="review">In review</option><option value="draft">Draft</option><option value="rejected">Changes requested</option>
        </Select>
      </div>
      {isLoading ? <Skeleton className="h-64" /> : data.length === 0 ? (
        <EmptyState icon={BookPlus} title="Create your first course" body="Plan the outline, upload lessons and submit it for review." action={<Button asChild><Link to="/studio/courses/new">New course</Link></Button>} />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            {
              key: "title",
              label: "Course",
              render: (c) => (
                <Link to={`/studio/courses/${c._id}`} className="flex items-center gap-3 font-semibold hover:text-primary">
                  <span className="grid size-10 place-items-center rounded-lg font-mono text-xs text-white" style={{ background: c.color }}>{glyph(c.title)}</span>
                  <span className="max-w-[280px] truncate">{c.title}</span>
                </Link>
              ),
            },
            { key: "status", label: "Status", render: (c) => <StatusPill status={c.status} /> },
            { key: "students", label: "Learners", render: (c) => num(c.studentsCount) },
            { key: "rating", label: "Rating", render: (c) => (c.ratingCount ? `★ ${c.ratingAvg}` : "—") },
            { key: "price", label: "Price", render: (c) => inr(c.discountPrice ?? c.price) },
            { key: "rev", label: "Revenue (30d)", render: (c) => inr(c.revenue30d) },
            { key: "act", label: "", render: (c) => <Link to={`/studio/courses/${c._id}`} className="font-semibold text-primary">{c.status === "draft" ? "Continue" : "Edit"}</Link> },
          ]}
        />
      )}
    </>
  );
}
