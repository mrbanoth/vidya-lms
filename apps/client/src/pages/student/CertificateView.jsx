import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, ExternalLink, Linkedin } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { apiUrl, get } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";
import { useConfig } from "@/hooks/useConfig";
import CertificateArt from "@/components/certificate/CertificateArt";
import { copyVerifyLink } from "@/features/certificates/copyVerifyLink";

export default function CertificateView() {
  const { code } = useParams();
  const config = useConfig();
  const { data: c, isLoading } = useQuery({ queryKey: ["verify", code], queryFn: () => get(`/certificates/verify/${code}`).then((r) => r.data) });
  useTitle(c ? `Certificate · ${c.courseTitle}` : "Certificate");
  if (isLoading) return <Skeleton className="h-96" />;
  const issued = new Date(c.issuedAt);
  const linkedIn = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(c.courseTitle)}&organizationName=Vidya&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certId=${c.code}&certUrl=${encodeURIComponent(`${window.location.origin}/verify/${c.code}`)}`;
  return (
    <>
      <Link to="/certificates" className="text-sm font-semibold text-primary">← All certificates</Link>
      <CertificateArt cert={c} platformName={config.platformName} />
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild><a href={apiUrl(`/certificates/${c.code}/pdf`)} target="_blank" rel="noreferrer"><Download /> Download PDF</a></Button>
        <Button variant="outline" onClick={() => copyVerifyLink(c.code)}><Copy /> Copy verify link</Button>
        <Button variant="outline" asChild><a href={linkedIn} target="_blank" rel="noreferrer"><Linkedin /> Add to LinkedIn</a></Button>
        <Button variant="ghost" asChild><Link to={`/verify/${c.code}`}><ExternalLink /> Public page</Link></Button>
      </div>
    </>
  );
}
