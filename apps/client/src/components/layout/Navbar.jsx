import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { Heart, Menu, ShoppingCart, X } from "lucide-react";
import SwitchButton from "@/components/kokonut/switch-button";
import { Button } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { useCart } from "@/features/cart/useCart";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import SearchPalette from "./SearchPalette";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

const LINKS = [
  ["/", "Home"],
  ["/courses", "Courses"],
  ["/teach", "For Instructors"],
  ["/pricing", "Pricing"],
];

function CountBadge({ n }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {n}
    </span>
  );
}

export function ThemeSwitch({ className }) {
  const setTheme = useUI((s) => s.setTheme);
  const [, force] = useState(0);
  const resolved = document.documentElement.classList.contains("dark") ? "dark" : "light";
  return (
    <SwitchButton
      size="sm"
      showLabel={false}
      className={className}
      theme={resolved}
      onThemeChange={(t) => {
        setTheme(t);
        force((x) => x + 1);
      }}
    />
  );
}

export default function Navbar() {
  const user = useAuth((s) => s.user);
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "text-primary hover:text-primary"
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <SearchPalette className="max-w-sm" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch className="hidden sm:inline-flex" />
          {user && (
            <Button variant="outline" size="icon" className="relative hidden sm:inline-flex" aria-label="Wishlist" onClick={() => navigate("/wishlist")}>
              <Heart />
            </Button>
          )}
          <Button variant="outline" size="icon" className="relative" aria-label={`Cart, ${count} items`} onClick={() => navigate("/cart")}>
            <ShoppingCart />
            <CountBadge n={count} />
          </Button>
          {user ? (
            <>
              <NotificationBell />
              <div className="hidden sm:block">
                <UserMenu />
              </div>
            </>
          ) : (
            <>
              <Button variant="outline" className="hidden border-primary/40 text-primary sm:inline-flex" asChild>
                <Link to="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
          <Button variant="outline" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-card lg:hidden">
          <div className="container-page grid gap-1 py-3" onClick={() => setOpen(false)}>
            <div className="mb-2 md:hidden" onClick={(e) => e.stopPropagation()}>
              <SearchPalette className="max-w-none" />
            </div>
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"} className="rounded-lg px-3 py-2.5 font-semibold hover:bg-muted">
                {label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/dashboard" className="rounded-lg px-3 py-2.5 font-semibold hover:bg-muted">Dashboard</NavLink>
                <NavLink to="/my-learning" className="rounded-lg px-3 py-2.5 font-semibold hover:bg-muted">My learning</NavLink>
                <NavLink to="/settings" className="rounded-lg px-3 py-2.5 font-semibold hover:bg-muted">Settings</NavLink>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" asChild><Link to="/sign-in">Sign in</Link></Button>
                <Button asChild><Link to="/sign-up">Get Started</Link></Button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm font-semibold">Theme</span>
              <ThemeSwitch />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
