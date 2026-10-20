import { Link } from "react-router";
import { Check } from "lucide-react";
import { REFUND_WINDOW_DAYS } from "@vidya/shared";
import { Button } from "@/components/ui";
import { useConfig } from "@/hooks/useConfig";
import { useTitle } from "@/hooks/useTitle";

export default function Pricing() {
  useTitle("Pricing");
  const config = useConfig();
  const PLANS = [
    {
      name: "Free courses",
      price: "₹0",
      note: "always",
      features: ["Full access to every free course", "Quizzes and progress tracking", "Certificate when you finish", "Q&A with the instructor"],
      cta: ["Browse free courses", "/courses?price=free"],
    },
    {
      name: "Paid courses",
      price: "Pay once",
      note: "per course, price set by the instructor",
      hot: true,
      features: ["Lifetime access, including updates", "Quizzes, resources and certificate", "GST invoice for every order", `${REFUND_WINDOW_DAYS}-day refund if it is not for you`],
      cta: ["Browse courses", "/courses"],
    },
    {
      name: "Teach",
      price: `${config.revenueShare}%`,
      note: "of every sale goes to you",
      features: ["Course builder with video, articles and quizzes", "Live earnings and student analytics", "Withdraw to UPI", "We handle hosting, payments and certificates"],
      cta: ["Start teaching", "/teach"],
    },
  ];
  const FAQ = [
    ["Can I get a refund?", `Yes. Request it from Orders within ${REFUND_WINDOW_DAYS} days of buying.`],
    ["Which payment methods work?", "UPI, cards, net banking and wallets through Razorpay. A GST invoice is created for every order."],
    ["Do I keep a course forever?", "Yes. Courses you buy are yours for life, including future updates."],
    ["Are there discounts?", "Instructors run sales on their courses, and coupon codes are shared on our channels from time to time."],
  ];
  return (
    <div className="container-page grid gap-14 py-12">
      <div className="grid justify-items-center gap-4 text-center">
        <span className="eyebrow">Pricing</span>
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-extrabold">No subscription. Pay for what you learn.</h1>
        <p className="max-w-[55ch] text-muted-foreground">Every course shows its price up front. Buy once and keep it for life.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className={p.hot ? "grid content-start gap-5 rounded-2xl border-2 border-primary bg-card p-7" : "grid content-start gap-5 rounded-2xl border border-border bg-card p-7"}>
            <h2 className="text-xl font-bold">{p.name}</h2>
            <div><span className="font-display text-4xl font-extrabold">{p.price}</span> <span className="text-muted-foreground">{p.note}</span></div>
            <ul className="grid gap-2.5 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />{f}</li>)}
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
