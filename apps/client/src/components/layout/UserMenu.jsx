import { useNavigate } from "react-router";
import { BookOpen, LayoutDashboard, Award, Settings, Receipt, GraduationCap, Shield, Heart } from "lucide-react";
import ProfileDropdown from "@/components/kokonut/profile-dropdown";
import { initials } from "@/lib/format";
import { signOut } from "@/features/auth/session";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { toast } from "sonner";

/** Kokonut UI ProfileDropdown wired to the signed-in user, theme and sign-out. */
export default function UserMenu() {
  const user = useAuth((s) => s.user);
  const { theme, setTheme } = useUI();
  const navigate = useNavigate();
  if (!user) return null;
  const go = (to) => () => navigate(to);
  const items = [
    { label: "Dashboard", icon: <LayoutDashboard />, onSelect: go("/dashboard") },
    { label: "My learning", icon: <BookOpen />, onSelect: go("/my-learning") },
    { label: "Wishlist", icon: <Heart />, onSelect: go("/wishlist") },
    { label: "Certificates", icon: <Award />, onSelect: go("/certificates") },
    { label: "Orders", icon: <Receipt />, onSelect: go("/orders") },
    { label: "Settings", icon: <Settings />, onSelect: go("/settings") },
  ];
  if (user.role !== "student") items.unshift({ label: "Instructor studio", icon: <GraduationCap />, onSelect: go("/studio") });
  if (user.role === "admin") items.unshift({ label: "Admin console", icon: <Shield />, onSelect: go("/admin") });

  return (
    <ProfileDropdown
      accounts={[
        {
          id: user._id,
          name: user.name,
          email: user.email,
          initials: initials(user.name),
          plan: user.role[0].toUpperCase() + user.role.slice(1),
        },
      ]}
      items={items}
      theme={theme}
      onThemeChange={setTheme}
      onSignOut={async () => {
        await signOut();
        toast.success("Signed out");
        navigate("/");
      }}
    />
  );
}
