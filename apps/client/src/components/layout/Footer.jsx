import { Link } from "react-router";
import Logo from "./Logo";

const COLS = [
  ["Learn", [["/courses", "All courses"], ["/categories/web-development", "Categories"], ["/pricing", "Pricing"], ["/verify", "Verify a certificate"]]],
  ["Teach", [["/teach", "Become an instructor"], ["/studio", "Instructor studio"]]],
  ["Company", [["/about", "About"], ["/contact", "Contact"]]],
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-[34ch] text-sm text-muted-foreground">
            Project-based courses from working engineers. Learn, build and get certified.
          </p>
          <span className="font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} Vidya Learning</span>
        </div>
        {COLS.map(([title, links]) => (
          <div key={title} className="grid content-start gap-2">
            <h4 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
            {links.map(([to, label]) => (
              <Link key={to} to={to} className="text-sm hover:text-primary">
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
