import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button, Card, Skeleton, StatusPill } from "@/components/ui";
import Logo from "@/components/layout/Logo";
import { get } from "@/lib/api";
import { date, money } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Invoice() {
  const { id } = useParams();
  const { data: o, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => get(`/orders/${id}`).then((r) => r.data) });
  useTitle(o ? `Invoice ${o.invoiceNo}` : "Invoice");
  if (isLoading) return <Skeleton className="h-96" />;
  const half = o.tax / 2;
  return (
    <>
      <div className="flex items-center justify-between print:hidden">
        <Link to="/orders" className="text-sm font-semibold text-primary">← All orders</Link>
        <Button variant="outline" onClick={() => window.print()}><Printer /> Print / Save PDF</Button>
      </div>
      <Card className="mx-auto grid w-full max-w-3xl gap-8 p-8 print:border-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <Logo />
            <span className="text-xs text-muted-foreground">Vidya Learning Pvt. Ltd. · HITEC City, Hyderabad 500081<br />GSTIN 36ABCDE1234F1Z5</span>
          </div>
          <div className="grid gap-1 text-right">
            <h1 className="text-2xl font-extrabold">Tax invoice</h1>
            <span className="font-mono text-sm">{o.invoiceNo}</span>
            <span className="text-sm text-muted-foreground">{date(o.paidAt || o.createdAt)}</span>
            <StatusPill status={o.status} />
          </div>
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Billed to</span>
          <b>{o.user.name}</b>
          <span>{o.user.email}</span>
        </div>
        <table className="tabular w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2">Course</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {o.items.map((i) => <tr key={i.title} className="border-b border-border"><td className="py-3">{i.title}<span className="block text-xs text-muted-foreground">SAC 999293 · Online education</span></td><td className="py-3 text-right">{money(i.price)}</td></tr>)}
          </tbody>
        </table>
        <dl className="tabular ml-auto grid w-full max-w-xs gap-1.5 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt>Discount ({o.coupon})</dt><dd>−{money(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt>CGST 9%</dt><dd>{money(half)}</dd></div>
          <div className="flex justify-between"><dt>SGST 9%</dt><dd>{money(half)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">Payment {o.paymentId ? <>ID <span className="font-mono">{o.paymentId}</span> via {o.method || o.gateway}</> : `via ${o.gateway}`}. This is a computer-generated invoice.</p>
      </Card>
    </>
  );
}
