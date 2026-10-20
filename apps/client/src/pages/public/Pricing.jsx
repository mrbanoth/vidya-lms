import { useState } from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { Badge, Button, Chip } from "@/components/ui";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

const PLANS = [
  { name: "Single course", price: [null, null], note: "one-time, from ₹399", features: ["Lifetime access to that course", "Quizzes and certificate", "Q&A with the instructor", "30-day money-back guarantee"], cta: ["Browse courses", "/courses"] },
  { name: "Pro", hot: true, price: [699, 489], note: "per month", features: ["Every paid course", "All certificates", "Downloadable resources", "Priority Q&A answers", "Offline on mobile"], cta: ["Start learning", "/sign-up"] },
  { name: "Teams", price: [549, 385], note: "per user / month", features: ["Everything in Pro", "Team dashboard and reports", "Assign learning paths", "SSO and invoices", "Dedicated support"], cta: ["Talk to sales", "/contact"] },
];

const FAQ = [
  ["Can I get a refund?", "Yes. Every course purchase has a 30-day money-back guarantee. Request it from Orders."],
  ["Which payment methods work?", "UPI, cards, net banking and wallets through Razorpay. GST invoices are generated automatically."],
  ["Do I keep courses forever?", "Courses you buy are yours for life, including future updates."],
  ["Do you have student discounts?", "Yes. Use code STUDENT40 at checkout for 40% off."],
];

export default function Pricing() {
  useTitle("Pricing");
  const [yearly, setYearly] = useState(false);
  return (
    <div className="container-page grid gap-14 py-12">
      <div className="grid justify-items-center gap-4 text-center">
        <span className="eyebrow">Pricing</span>
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-extrabold">Buy one course or learn everything</h1>
        <p className="max-w-[55ch] text-muted-foreground">Single courses are a one-time payment with lifetime access. Pro unlocks the full catalog.</p>
        <div className="flex gap-2">
          <Chip active={!yearly} onClick={() => setYearly(false)}>Monthly</Chip>
          <Chip active={yearly} onClick={() => setYearly(true)}>Yearly · save 30%</Chip>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className={cn("grid content-start gap-5 rounded-2xl border bg-card p-7", p.hot ? "border-2 border-primary shadow-[0_24px_60px_-30px_rgba(15,122,92,.6)]" : "border-border")}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{p.name}</h2>
              {p.hot && <Badge>Most popular</Badge>}
            </div>
            <div>
              <span className="font-display text-4xl font-extrabold">{p.price[0] ? `₹${yearly ? p.price[1] : p.price[0]}` : "Pay once"}</span>{" "}
              <span className="text-muted-foreground">{p.note}</span>
              {yearly && p.price[0] && <p className="text-xs text-muted-foreground">Billed yearly</p>}
            </div>
            <ul className="grid gap-2.5 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 text-primary" />{f}</li>)}
            </ul>
            <Button variant={p.hot ? "default" : "outline"} size="lg" asChild><Link to={p.cta[1]}>{p.cta[0]}</Link></Button>
          </div>
        ))}
      </div>
      <section className="mx-auto grid w-full max-w-3xl gap-4">
        <h2 className="text-2xl font-bold">Questions</h2>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold">
                {q}<span className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-4 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
