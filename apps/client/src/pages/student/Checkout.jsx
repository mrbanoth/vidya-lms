import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Skeleton, Spinner } from "@/components/ui";
import OrderSummary from "@/features/cart/OrderSummary";
import { useCart } from "@/features/cart/useCart";
import { useQuote } from "@/features/cart/useQuote";
import { errorMessage, post } from "@/lib/api";
import { inr, effectivePrice, money } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const METHODS = [
  ["upi", Smartphone, "UPI"],
  ["card", CreditCard, "Card"],
  ["netbanking", Landmark, "Net banking"],
  ["wallet", Wallet, "Wallet"],
];

export default function Checkout() {
  useTitle("Checkout");
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cart = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  const [testOrder, setTestOrder] = useState(null);
  const quote = useQuote(cart.items, coupon);

  if (!cart.isLoading && cart.items.length === 0 && !testOrder) return <Navigate to="/cart" replace />;

  const finish = async (orderId, extra = {}) => {
    await post("/checkout/verify", { orderId, ...extra });
    qc.invalidateQueries();
    navigate(`/checkout/success/${orderId}`, { replace: true });
  };

  const pay = async () => {
    setBusy(true);
    try {
      const res = await post("/checkout", { courseIds: cart.items.map((c) => c._id), coupon: coupon || undefined });
      const { order, mode, razorpay } = res.data;
      if (mode === "free") {
        qc.invalidateQueries();
        return navigate(`/checkout/success/${order._id}`, { replace: true });
      }
      if (mode === "test") {
        setTestOrder(order);
        return setBusy(false);
      }
      if (!(await loadRazorpay())) throw new Error("Could not load Razorpay. Check your connection.");
      const rzp = new window.Razorpay({
        key: razorpay.key,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: razorpay.name,
        description: `${cart.items.length} course(s)`,
        order_id: razorpay.orderId,
        prefill: { ...razorpay.prefill, method },
        theme: { color: "#0f7a5c" },
        handler: async (resp) => {
          try {
            await finish(order._id, resp);
          } catch (e) {
            toast.error(errorMessage(e));
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () => {
        post(`/checkout/${order._id}/failed`).catch(() => {});
        toast.error("Payment failed. No money was taken. Try another method.");
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      toast.error(errorMessage(e, e.message));
      setBusy(false);
    }
  };

  return (
    <div className="container-page grid gap-8 py-10">
      <ol className="flex gap-0 text-sm" aria-label="Checkout steps">
        {["Cart", "Payment", "Done"].map((s, i) => (
          <li key={s} className={cn("flex-1 border-t-[3px] pt-2", i <= 1 ? "border-primary" : "border-border", i === 1 ? "font-semibold" : "text-muted-foreground")}>
            <span className="block font-mono text-[11px]">Step {i + 1}</span>{s}
          </li>
        ))}
      </ol>
      <PageHeader title="Checkout" />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <Card className="grid gap-4">
            <h2 className="text-lg font-bold">Billing details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="b-name"><Input id="b-name" defaultValue={user.name} /></Field>
              <Field label="Email for receipt" htmlFor="b-email"><Input id="b-email" defaultValue={user.email} disabled /></Field>
            </div>
          </Card>
          <Card className="grid gap-4">
            <h2 className="text-lg font-bold">Payment method</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
              {METHODS.map(([id, Icon, label]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={method === id}
                  onClick={() => setMethod(id)}
                  className={cn("grid cursor-pointer justify-items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-semibold transition", method === id ? "border-primary bg-accent text-accent-foreground" : "border-border hover:border-muted-foreground")}
                >
                  <Icon className="size-5" />{label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">You will complete payment securely with Razorpay. Card details never touch our servers.</p>
          </Card>
          <Card className="grid gap-3">
            <h2 className="text-lg font-bold">Courses ({cart.items.length})</h2>
            {cart.isLoading ? <Skeleton className="h-16" /> : cart.items.map((c) => (
              <div key={c._id} className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{c.title}</span><b className="tabular">{inr(effectivePrice(c))}</b></div>
            ))}
          </Card>
        </div>
        <OrderSummary
          quote={quote.data}
          loading={quote.isLoading}
          coupon={quote.isError ? "" : coupon}
          couponError={couponError}
          onApplyCoupon={async (code) => {
            setCouponError("");
            try {
              await post("/checkout/quote", { courseIds: cart.items.map((c) => c._id), code });
              setCoupon(code);
              toast.success(`${code} applied`);
            } catch (e) {
              setCouponError(errorMessage(e));
            }
          }}
          onRemoveCoupon={() => setCoupon("")}
        >
          <Button size="lg" onClick={pay} disabled={busy || quote.isLoading}>
            {busy && <Spinner />} Pay {quote.data ? money(quote.data.total) : ""}
          </Button>
          <p className="text-center text-xs text-muted-foreground">By paying you agree to the <Link to="/pricing" className="underline">refund policy</Link>.</p>
        </OrderSummary>
      </div>

      <Modal
        open={Boolean(testOrder)}
        onOpenChange={(o) => !o && setTestOrder(null)}
        title="Test payment"
        description="Razorpay keys are not configured, so this development build uses a simulated gateway. No real money moves."
        footer={
          <>
            <Button variant="outline" onClick={async () => { await post(`/checkout/${testOrder._id}/failed`).catch(() => {}); setTestOrder(null); toast.error("Payment marked as failed"); }}>Simulate failure</Button>
            <Button onClick={async () => { setBusy(true); try { await finish(testOrder._id, { method }); } catch (e) { toast.error(errorMessage(e)); setBusy(false); } }} disabled={busy}>
              {busy && <Spinner />} Pay {testOrder && money(testOrder.total)}
            </Button>
          </>
        }
      >
        <div className="flex items-center justify-between rounded-xl bg-muted p-4 text-sm">
          <span>Order <span className="font-mono">{testOrder?._id.slice(-8)}</span></span>
          <Badge tone="amber">Test mode</Badge>
        </div>
      </Modal>
    </div>
  );
}
