import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, ExternalLink, Linkedin } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import Logo from "@/components/layout/Logo";
import { apiUrl, get } from "@/lib/api";
import { date } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import { copyVerifyLink } from "@/features/certificates/copyVerifyLink";

export default function CertificateView() {
  const { code } = useParams();
  const { data: c, isLoading } = useQuery({ queryKey: ["verify", code], queryFn: () => get(`/certificates/verify/${code}`).then((r) => r.data) });
  useTitle(c ? `Certificate · ${c.courseTitle}` : "Certificate");
  if (isLoading) return <Skeleton className="h-96" />;
  const issued = new Date(c.issuedAt);
  const linkedIn = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(c.courseTitle)}&organizationName=Vidya&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certId=${c.code}&certUrl=${encodeURIComponent(`${window.location.origin}/verify/${c.code}`)}`;
  return (
    <>
      <Link to="/certificates" className="text-sm font-semibold text-primary">← All certificates</Link>
      <div className="relative mx-auto grid w-full max-w-3xl justify-items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-[clamp(1.5rem,5vw,3rem)] text-center">
        <span className="pointer-events-none absolute inset-3 rounded-xl border-[1.5px] border-primary/40" />
        <Logo />
        <span className="eyebrow mt-2">Certificate of completion</span>
        <span className="text-muted-foreground">This certifies that</span>
        <span className="font-display text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold text-primary">{c.userName}</span>
        <span className="text-muted-foreground">has completed</span>
        <h1 className="text-[clamp(1.3rem,3vw,1.9rem)] font-bold">{c.courseTitle}</h1>
        <span className="text-sm text-muted-foreground">{c.hours} hours of content</span>
        <div className="mt-6 flex w-full flex-wrap items-end justify-between gap-4 text-left text-sm">
          <div><b className="font-display">{c.instructorName}</b><div className="text-xs text-muted-foreground">Instructor</div></div>
          <div className="text-right"><b className="font-mono">{c.code}</b><div className="text-xs text-muted-foreground">Issued {date(c.issuedAt)}</div></div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild><a href={apiUrl(`/certificates/${c.code}/pdf`)} target="_blank" rel="noreferrer"><Download /> Download PDF</a></Button>
        <Button variant="outline" onClick={() => copyVerifyLink(c.code)}><Copy /> Copy verify link</Button>
        <Button variant="outline" asChild><a href={linkedIn} target="_blank" rel="noreferrer"><Linkedin /> Add to LinkedIn</a></Button>
        <Button variant="ghost" asChild><Link to={`/verify/${c.code}`}><ExternalLink /> Public page</Link></Button>
      </div>
    </>
  );
}
