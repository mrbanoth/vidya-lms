import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Avatar, Button, DataTable, Input, PageHeader, Progress, Select, Skeleton } from "@/components/ui";
import { get } from "@/lib/api";
import { date, timeAgo } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import { useTitle } from "@/hooks/useTitle";

function toCsv(rows) {
  const head = ["Name", "Email", "Course", "Progress", "Enrolled", "Last active"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head, ...rows.map((r) => [r.user.name, r.user.email, r.course.title, `${r.progress}%`, date(r.enrolledAt), date(r.lastActiveAt)])].map((r) => r.map(esc).join(",")).join("\n");
}

export default function Students() {
  useTitle("Students");
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const dq = useDebounce(q);
  const { data: courses = [] } = useQuery({ queryKey: ["instructor-courses"], queryFn: () => get("/instructor/courses").then((r) => r.data) });
  const { data = [], isLoading } = useQuery({ queryKey: ["students", dq, course], queryFn: () => get("/instructor/students", { q: dq, course: course || undefined }).then((r) => r.data) });
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(data)], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "vidya-students.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeader title="Students" description={`${data.length} enrollments`} actions={<Button variant="outline" onClick={exportCsv} disabled={!data.length}><Download /> Export CSV</Button>} />
      <div className="flex flex-wrap gap-3">
        <Input aria-label="Search students" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select aria-label="Course" value={course} onChange={(e) => setCourse(e.target.value)} className="w-auto max-w-xs">
          <option value="">All courses</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </Select>
      </div>
      {isLoading ? <Skeleton className="h-64" /> : (
        <DataTable
          rows={data}
          empty="No learners match."
          columns={[
            { key: "user", label: "Learner", render: (r) => <div className="flex items-center gap-3"><Avatar name={r.user.name} src={r.user.avatar} size={30} /><div><b className="block">{r.user.name}</b><span className="text-xs text-muted-foreground">{r.user.email}</span></div></div> },
            { key: "course", label: "Course", render: (r) => <span className="block max-w-[220px] truncate">{r.course.title}</span> },
            { key: "progress", label: "Progress", render: (r) => <div className="flex items-center gap-2"><Progress value={r.progress} className="w-24" /><span className="font-mono text-xs">{r.progress}%</span></div> },
            { key: "enrolled", label: "Enrolled", render: (r) => date(r.enrolledAt) },
            { key: "active", label: "Last active", render: (r) => timeAgo(r.lastActiveAt) },
          ]}
        />
      )}
    </>
  );
}
