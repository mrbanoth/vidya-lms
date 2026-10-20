import { useState } from "react";
import { Lock } from "lucide-react";
import { Badge, Button, Card, Input, Skeleton } from "@/components/ui";
import { money } from "@/lib/format";

export default function OrderSummary({ quote, loading, coupon, onApplyCoupon, onRemoveCoupon, couponError, children }) {
  const [code, setCode] = useState("");
  return (
    <Card className="grid content-start gap-4 lg:sticky lg:top-24">
      <h2 className="text-lg font-bold">Order summary</h2>
      {loading || !quote ? (
        <Skeleton className="h-28" />
      ) : (
        <dl className="tabular grid gap-2 text-sm">
          {quote.original > quote.subtotal && (
            <div className="flex justify-between"><dt className="text-muted-foreground">Original price</dt><dd className="text-muted-foreground line-through">{money(quote.original)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-muted-foreground">Course price</dt><dd>{money(quote.subtotal)}</dd></div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-primary"><dt>Coupon {coupon}</dt><dd>−{money(quote.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-muted-foreground">GST (18%)</dt><dd>{money(quote.tax)}</dd></div>
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <dt className="font-semibold">Total</dt>
            <dd className="font-display text-2xl font-extrabold">{money(quote.total)}</dd>
          </div>
        </dl>
      )}
      {coupon ? (
        <div className="flex items-center justify-between">
          <Badge>{coupon} applied</Badge>
          <button className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={onRemoveCoupon}>Remove</button>
        </div>
      ) : !onApplyCoupon ? (
        <p className="text-xs text-muted-foreground">Have a coupon? Apply it at checkout.</p>
      ) : (
        <form className="grid gap-1.5" onSubmit={(e) => { e.preventDefault(); code.trim() && onApplyCoupon(code.trim().toUpperCase()); }}>
          <div className="flex gap-2">
            <label htmlFor="coupon" className="sr-only">Coupon code</label>
            <Input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="font-mono uppercase" invalid={!!couponError} />
            <Button variant="outline" type="submit">Apply</Button>
          </div>
          {couponError ? <p className="text-xs text-destructive">{couponError}</p> : <p className="text-xs text-muted-foreground">Try LEARN10 or STUDENT40</p>}
        </form>
      )}
      {children}
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3" /> Secure payment · 30-day refund</p>
    </Card>
  );
}
