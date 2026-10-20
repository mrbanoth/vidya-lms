import { useQuery } from "@tanstack/react-query";
import { Award, BookOpenCheck, MessageSquare } from "lucide-react";
import Logo from "./Logo";
import { get } from "@/lib/api";
import { compact } from "@/lib/format";

const POINTS = [
  [BookOpenCheck, "Pick up where you stopped", "Every lesson remembers your place."],
  [MessageSquare, "Ask inside the lesson", "Instructors answer questions in the course."],
  [Award, "Certificates you can verify", "Each one has a public link and QR code."],
];

export default function AuthShell({ children }) {
  const { data } = useQuery({ queryKey: ["stats"], queryFn: () => get("/stats").then((r) => r.data), staleTime: 300_000 });
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden bg-hero p-10 lg:grid lg:content-between">
        <Logo />
        <ul className="grid gap-6">
          {POINTS.map(([Icon, t, d]) => (
            <li key={t} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-sm"><Icon className="size-5" /></span>
              <span className="grid gap-0.5"><b className="font-display text-lg">{t}</b><span className="text-sm opacity-70">{d}</span></span>
            </li>
          ))}
        </ul>
        <div className="flex gap-6 text-sm opacity-75">
          {data && data.courses > 0 && <span>{compact(data.courses)} courses</span>}
          {data && data.learners > 0 && <span>{compact(data.learners)} learners</span>}
        </div>
      </aside>
      <main className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="grid w-full max-w-[400px] gap-6">
          <Logo className="lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
