import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, SearchX } from "lucide-react";
import { Button, Card, EmptyState, Input, Skeleton } from "@/components/ui";
import { apiUrl, get } from "@/lib/api";
import { date } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Verify() {
  useTitle("Verify a certificate");
  const { code } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(code || "");
  const q = useQuery({ queryKey: ["verify", code], queryFn: () => get(`/certificates/verify/${code}`).then((r) => r.data), enabled: Boolean(code), retry: false });
  return (
    <div className="container-page grid max-w-3xl gap-8 py-12">
      <div className="grid gap-3">
        <span className="eyebrow">Certificate verification</span>
        <h1 className="text-[clamp(2rem,4vw,2.6rem)] font-extrabold">Check a Vidya certificate</h1>
        <p className="text-muted-foreground">Enter the ID printed at the bottom of the certificate, or scan its QR code.</p>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); value.trim() && navigate(`/verify/${value.trim().toUpperCase()}`); }}>
        <label htmlFor="cert-id" className="sr-only">Certificate ID</label>
        <Input id="cert-id" value={value} onChange={(e) => setValue(e.target.value)} placeholder="VID-XXXXXX-XXXX-2026" className="h-12 font-mono" />
        <Button size="lg" type="submit">Verify</Button>
      </form>
      {q.isLoading && <Skeleton className="h-40" />}
      {q.isError && <EmptyState icon={SearchX} title="No certificate found" body={q.error?.response?.data?.message} />}
      {q.data && (
        <Card className="grid gap-5 border-primary p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground"><BadgeCheck className="size-4" /> Valid certificate</span>
            <span className="font-mono text-sm text-muted-foreground">{q.data.code}</span>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[["Issued to", q.data.userName], ["Course", q.data.courseTitle], ["Instructor", q.data.instructorName], ["Issued on", date(q.data.issuedAt)]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><a href={apiUrl(`/certificates/${q.data.code}/pdf`)} target="_blank" rel="noreferrer">Open PDF</a></Button>
            {q.data.course?.slug && <Button variant="ghost" asChild><Link to={`/courses/${q.data.course.slug}`}>View course</Link></Button>}
          </div>
        </Card>
      )}
    </div>
  );
}
