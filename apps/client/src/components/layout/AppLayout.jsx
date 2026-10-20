import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Award, BarChart3, Bell, BookOpen, CheckSquare, Compass, CreditCard, FileText, FolderTree, GraduationCap,
  Heart, LayoutDashboard, LogOut, Menu, MessageSquare, PlusCircle, Receipt, Settings, Shield, Tag, Users, Wallet, X,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { signOut } from "@/features/auth/session";
import { useLiveNotifications } from "@/features/notifications/useNotifications";
import { Avatar, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import SearchPalette from "./SearchPalette";
import { ThemeSwitch } from "./Navbar";

const NAV = {
  student: {
    label: "Learning",
    home: "/",
    items: [
      ["/dashboard", LayoutDashboard, "Dashboard"],
      ["/my-learning", BookOpen, "My learning"],
      ["/wishlist", Heart, "Wishlist"],
      ["/certificates", Award, "Certificates"],
      ["/orders", Receipt, "Orders"],
      ["/notifications", Bell, "Notifications"],
      ["/settings", Settings, "Settings"],
      ["/courses", Compass, "Browse courses"],
    ],
  },
  instructor: {
    label: "Studio",
    home: "/studio",
    items: [
      ["/studio", BarChart3, "Dashboard", true],
      ["/studio/courses", BookOpen, "Courses"],
      ["/studio/courses/new", PlusCircle, "New course"],
      ["/studio/students", Users, "Students"],
      ["/studio/qa", MessageSquare, "Q&A"],
      ["/studio/earnings", Wallet, "Earnings"],
    ],
  },
  admin: {
    label: "Admin",
    home: "/admin",
    items: [
      ["/admin", BarChart3, "Overview", true],
      ["/admin/users", Users, "Users"],
      ["/admin/courses", CheckSquare, "Course review"],
      ["/admin/payments", CreditCard, "Payments"],
      ["/admin/payouts", Wallet, "Payouts"],
      ["/admin/coupons", Tag, "Coupons"],
      ["/admin/categories", FolderTree, "Categories"],
      ["/admin/reports", FileText, "Reports"],
      ["/admin/audit", Shield, "Audit log"],
      ["/admin/settings", Settings, "Settings"],
    ],
  },
};

function SideNav({ role, onNavigate }) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const nav = NAV[role];
  const switches = [
    user.role !== "student" && role !== "student" && ["/dashboard", GraduationCap, "Learner view"],
    user.role !== "student" && role !== "instructor" && ["/studio", GraduationCap, "Instructor studio"],
    user.role === "admin" && role !== "admin" && ["/admin", Shield, "Admin console"],
  ].filter(Boolean);

  const link = ([to, Icon, label, end]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-foreground/70 transition-colors hover:bg-white/5 hover:text-ink-foreground",
          isActive && "bg-white/10 font-semibold text-ink-foreground"
        )
      }
    >
      <Icon className="size-[17px]" />
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-5">
      <Logo to={nav.home} label={role === "student" ? "Vidya" : nav.label} inverted className="mb-5 ml-2 text-ink-foreground" />
      <p className="px-3 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-foreground/45">{nav.label}</p>
      {nav.items.map(link)}
      {switches.length > 0 && (
        <>
          <p className="mt-4 px-3 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-foreground/45">Switch view</p>
          {switches.map(link)}
        </>
      )}
      <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-2 pt-4">
        <Avatar name={user.name} src={user.avatar} size={34} />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm text-ink-foreground">{user.name}</b>
          <span className="text-xs capitalize text-ink-foreground/55">{user.role}</span>
        </div>
        <button
          className="cursor-pointer rounded-md p-2 text-ink-foreground/60 hover:bg-white/10 hover:text-ink-foreground"
          aria-label="Sign out"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ role }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useLiveNotifications();
  const current = NAV[role].items
    .filter(([to]) => pathname === to || pathname.startsWith(`${to}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh bg-ink lg:block">
        <SideNav role={role} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] bg-ink" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <Button variant="ghost" size="icon-sm" className="absolute right-3 top-4 text-ink-foreground hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </Button>
            <SideNav role={role} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu />
            </Button>
            <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold">{current?.[2] || NAV[role].label}</h2>
            <div className="hidden w-80 md:block">
              <SearchPalette />
            </div>
            <ThemeSwitch />
            <NotificationBell />
          </div>
        </header>
        <main id="main" className="mx-auto grid w-full max-w-[1200px] content-start gap-6 px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
