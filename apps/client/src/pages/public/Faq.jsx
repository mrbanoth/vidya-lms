import { Link } from "react-router";
import { REFUND_WINDOW_DAYS } from "@vidya/shared";
import { Button } from "@/components/ui";
import { useTitle } from "@/hooks/useTitle";

const FAQ = [
  ["How do I enroll in a course?", "Open a course, choose Add to cart or Buy now, and finish checkout. Free courses enroll you in one click. Enrolled courses appear under My learning."],
  ["Do I keep access after I buy?", "Yes. Purchased courses stay in your account with lifetime access, including updates the instructor makes later."],
  ["Can I get a refund?", `You can request a refund from Orders within ${REFUND_WINDOW_DAYS} days of purchase. An admin reviews each request, usually within 2 working days.`],
  ["How do certificates work?", "Finish every lesson in a course and a certificate is issued automatically. Each one has a public verification link and a downloadable PDF."],
  ["Can I learn on my phone?", "Yes. Vidya works in any modern mobile browser, and your progress syncs across devices."],
  ["How do I ask the instructor a question?", "Use the Q&A tab inside any lesson. The instructor is notified and the answer is shown to every learner on that lesson."],
  ["How do I become an instructor?", "Choose “I want to teach” when you sign up, or contact us. Courses are reviewed by the Vidya team before they are published."],
  ["How are instructors paid?", "Instructors earn a share of every sale and can request a payout from Earnings once they have a balance."],
];

export default function Faq() {
  useTitle("FAQ");
  return (
    <div className="container-page grid max-w-3xl gap-8 py-12">
      <div className="grid gap-2 text-center">
        <span className="eyebrow">Help center</span>
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-extrabold">Frequently asked questions</h1>
        <p className="text-muted-foreground">Quick answers about courses, payments and certificates.</p>
      </div>
      <div className="grid gap-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group rounded-xl border border-border bg-card px-5 py-4 open:border-primary/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <div className="grid justify-items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <b>Still need help?</b>
        <p className="text-sm text-muted-foreground">Our team usually replies within one working day.</p>
        <Button asChild><Link to="/contact">Contact support</Link></Button>
      </div>
    </div>
  );
}
